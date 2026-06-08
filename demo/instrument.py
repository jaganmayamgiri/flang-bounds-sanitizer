#!/usr/bin/env python3
import sys
import re

def split_subscripts(subscripts_str):
    subs = []
    current_sub = ""
    depth = 0
    for char in subscripts_str:
        if char == '(':
            depth += 1
            current_sub += char
        elif char == ')':
            depth -= 1
            current_sub += char
        elif char == ',' and depth == 0:
            subs.append(current_sub.strip())
            current_sub = ""
        else:
            current_sub += char
    if current_sub.strip():
        subs.append(current_sub.strip())
    return subs

def split_section(sub):
    parts = []
    current = ""
    depth = 0
    for char in sub:
        if char == '(':
            depth += 1
            current += char
        elif char == ')':
            depth -= 1
            current += char
        elif char == ':' and depth == 0:
            parts.append(current.strip())
            current = ""
        else:
            current += char
    parts.append(current.strip())
    return parts if len(parts) > 1 else None

def instrument_file(input_path, output_path):
    with open(input_path, 'r') as f:
        content = f.read()

    # Normalize newlines and split into lines
    lines = content.splitlines()

    # Step 1: Parse derived types definition
    type_blocks = re.findall(r'(?i)\btype\s+(\w+)\s*\n(.*?)\n\s*end\s+type', content, re.DOTALL)
    derived_types = {}
    for type_name, block_content in type_blocks:
        derived_types[type_name.lower()] = parse_declarations(block_content.splitlines())

    arrays = {}
    derived_vars = {} # name -> type_name
    in_block = False
    block_header_idx = -1
    first_exec_idx = -1
    
    output_lines = []
    
    # Group lines into statements based on continuation character '&'
    statements = []
    current_stmt = []
    for idx, line in enumerate(lines):
        line_clean = line.split('!')[0].strip()
        current_stmt.append(idx)
        if not line_clean.endswith('&'):
            statements.append(current_stmt)
            current_stmt = []
    if current_stmt:
        statements.append(current_stmt)
        
    for stmt_indices in statements:
        start_idx = stmt_indices[0]
        first_line_strip = lines[start_idx].strip()
        header_match = re.match(r'(?i)^\s*(program|subroutine|function)\s+(\w+)', first_line_strip)
        if header_match:
            in_block = True
            first_exec_idx = -1
            arrays = {}
            derived_vars = {}
            for idx in stmt_indices:
                output_lines.append(lines[idx])
            output_lines.append("  use BoundsCheckModule")
            continue
            
        # Check for end of block
        is_end_of_block = False
        if in_block and first_line_strip.lower().startswith('end'):
            end_parts = first_line_strip.lower().split()
            if len(end_parts) == 1:
                is_end_of_block = True
            elif len(end_parts) > 1:
                if end_parts[1] in ['program', 'subroutine', 'function']:
                    is_end_of_block = True
                    
        if is_end_of_block:
            in_block = False
            for idx in stmt_indices:
                output_lines.append(lines[idx])
            continue
            
        if in_block:
            combined_clean = ""
            for idx in stmt_indices:
                l_clean = lines[idx].split('!')[0].strip()
                if l_clean.endswith('&'):
                    l_clean = l_clean[:-1].strip()
                combined_clean += " " + l_clean
            combined_clean = combined_clean.strip()
            
            is_decl = False
            if combined_clean:
                if '::' in combined_clean:
                    is_decl = True
                else:
                    first_word = combined_clean.split()[0].lower()
                    if first_word in ['use', 'implicit', 'integer', 'real', 'logical', 'character', 'type', 'dimension', 'pointer', 'allocatable', 'parameter', 'target', 'end', 'contains']:
                        is_decl = True
            
            if is_decl:
                new_arrays, new_derived = parse_decl_line(combined_clean, derived_types)
                arrays.update(new_arrays)
                derived_vars.update(new_derived)
                for idx in stmt_indices:
                    output_lines.append(lines[idx])
            else:
                if first_exec_idx == -1 and combined_clean:
                    first_exec_idx = len(output_lines)
                    esc_path = input_path.replace("\\", "/")
                    output_lines.append(f'  character(len={len(esc_path)+1}, kind=c_char), target, save :: src_file = c_char_"{esc_path}" // c_null_char')
                
                is_mem_mgmt = False
                if combined_clean:
                    first_word_parts = combined_clean.split('(')[0].split()
                    if first_word_parts:
                        first_word = first_word_parts[0].lower()
                        if first_word in ['allocate', 'deallocate', 'nullify']:
                            is_mem_mgmt = True
                
                if combined_clean and not is_mem_mgmt:
                    assoc_idx = combined_clean.find('=>')
                    accesses = find_array_accesses(combined_clean, arrays, derived_vars, derived_types)
                    if accesses:
                        checks = []
                        associated_checked = set()
                        for access in accesses:
                            if assoc_idx != -1 and combined_clean.find(access['full_match']) < assoc_idx:
                                continue
                                
                            var_info = access['var_info']
                            var_name = var_info['name']
                            
                            # Inlined association check
                            if (var_info['is_pointer'] or var_info['is_allocatable']) and var_name.lower() not in associated_checked:
                                if var_info['is_pointer']:
                                    checks.append(f"  if (.not. associated({var_name})) call FortranABoundsCheckAssociated({var_name}, src_file, {start_idx+1})")
                                else:
                                    checks.append(f"  if (.not. allocated({var_name})) call FortranABoundsCheckAssociated({var_name}, src_file, {start_idx+1})")
                                associated_checked.add(var_name.lower())
                            
                            subs = split_subscripts(access['subscripts_str'])
                            for d, sub in enumerate(subs):
                                if sub.strip() == ':':
                                    continue
                                    
                                section_parts = split_section(sub)
                                if section_parts is not None:
                                    # Triplet section bounds check
                                    lower = section_parts[0] if section_parts[0] else f"lbound({var_name}, {d+1})"
                                    upper = section_parts[1] if section_parts[1] else f"ubound({var_name}, {d+1})"
                                    stride = section_parts[2] if (len(section_parts) > 2 and section_parts[2]) else "1"
                                    
                                    # Inline check depending on stride sign
                                    if stride.startswith('-') or (stride.isdigit() and int(stride) < 0):
                                        checks.append(f"  if ({upper} < lbound({var_name}, {d+1}) .or. {lower} > ubound({var_name}, {d+1})) "
                                                      f"call FortranABoundsCheckSection({var_name}, {d}, int({lower}, 8), int({upper}, 8), int({stride}, 8), int(lbound({var_name}, {d+1}), 8), src_file, {start_idx+1})")
                                    else:
                                        checks.append(f"  if ({lower} < lbound({var_name}, {d+1}) .or. {upper} > ubound({var_name}, {d+1})) "
                                                      f"call FortranABoundsCheckSection({var_name}, {d}, int({lower}, 8), int({upper}, 8), int({stride}, 8), int(lbound({var_name}, {d+1}), 8), src_file, {start_idx+1})")
                                else:
                                    # Inlined subscript check: idx < lb .or. idx > ub
                                    checks.append(f"  if ({sub} < lbound({var_name}, {d+1}) .or. {sub} > ubound({var_name}, {d+1})) "
                                                  f"call FortranABoundsCheck({var_name}, {d}, int({sub}, 8), int(lbound({var_name}, {d+1}), 8), src_file, {start_idx+1})")
                        
                        for check in checks:
                            output_lines.append(check)
                            
                for idx in stmt_indices:
                    output_lines.append(lines[idx])
        else:
            for idx in stmt_indices:
                output_lines.append(lines[idx])

    with open(output_path, 'w') as f:
        f.write('\n'.join(output_lines) + '\n')

def parse_declarations(lines):
    arrays = {}
    for line in lines:
        line_clean = line.split('!')[0].strip()
        if not line_clean or '::' not in line_clean:
            continue
        new_arrays, _ = parse_decl_line(line_clean, {})
        arrays.update(new_arrays)
    return arrays

def parse_decl_line(line_clean, derived_types):
    if '::' not in line_clean:
        return {}, {}
        
    arrays = {}
    derived_vars = {}
    
    parts = line_clean.split('::')
    attrs_part = parts[0]
    vars_part = parts[1]
    
    attrs = [a.strip().lower() for a in attrs_part.split(',')]
    is_pointer = 'pointer' in attrs
    is_allocatable = 'allocatable' in attrs
    
    dim_rank = None
    for attr in attrs:
        if attr.startswith('dimension('):
            dims = attr[len('dimension('):-1]
            dim_rank = dims.count(',') + 1
            
    type_name = None
    if attrs:
        type_match = re.match(r'(?i)^\s*type\s*\(\s*(\w+)\s*\)', attrs[0])
        if type_match:
            type_name = type_match.group(1).lower()

    vars_list = []
    current_var = ""
    paren_depth = 0
    for char in vars_part:
        if char == '(' or char == '[':
            paren_depth += 1
            current_var += char
        elif char == ')' or char == ']':
            paren_depth -= 1
            current_var += char
        elif char == ',' and paren_depth == 0:
            vars_list.append(current_var.strip())
            current_var = ""
        else:
            current_var += char
    if current_var.strip():
        vars_list.append(current_var.strip())
        
    for var_expr in vars_list:
        match = re.match(r'^([a-zA-Z_]\w*)(?:\(([^)]+)\))?(?:\[([^\]]+)\])?(?:\s*=\s*(.*))?$', var_expr)
        if match:
            var_name = match.group(1)
            shape = match.group(2)
            codim = match.group(3)
            
            rank = dim_rank
            if shape:
                rank = shape.count(',') + 1
            
            is_coarray = codim is not None
            
            if rank is not None or is_pointer or is_allocatable:
                if rank is None:
                    rank = 1
                arrays[var_name.lower()] = {
                    'name': var_name,
                    'rank': rank,
                    'is_pointer': is_pointer,
                    'is_allocatable': is_allocatable,
                    'is_coarray': is_coarray
                }
            
            if type_name:
                derived_vars[var_name.lower()] = type_name
                
    return arrays, derived_vars

def find_array_accesses(line, arrays, derived_vars, derived_types):
    accesses = []
    
    matches = re.finditer(r'(\b[a-zA-Z_]\w*(?:%[a-zA-Z_]\w*)*)\s*\(', line)
    for m in matches:
        full_name = m.group(1)
        start_idx = m.start()
        
        is_array = False
        var_info = None
        
        parts = full_name.lower().split('%')
        if len(parts) == 1:
            name = parts[0]
            if name in arrays:
                is_array = True
                var_info = arrays[name]
        elif len(parts) == 2:
            var_name, comp_name = parts[0], parts[1]
            if var_name in derived_vars:
                t_name = derived_vars[var_name]
                if t_name in derived_types and comp_name in derived_types[t_name]:
                    is_array = True
                    var_info = derived_types[t_name][comp_name]
                    var_info = dict(var_info)
                    var_info['name'] = m.group(1)
        
        if is_array:
            paren_idx = line.find('(', start_idx)
            if paren_idx != -1:
                depth = 1
                end_idx = -1
                for j in range(paren_idx + 1, len(line)):
                    if line[j] == '(':
                        depth += 1
                    elif line[j] == ')':
                        depth -= 1
                        if depth == 0:
                            end_idx = j
                            break
                if end_idx != -1:
                    subscripts_str = line[paren_idx + 1:end_idx]
                    accesses.append({
                        'var_info': var_info,
                        'subscripts_str': subscripts_str,
                        'full_match': line[start_idx:end_idx + 1]
                    })
    return accesses

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: instrument.py <input.f90> <output.f90>")
        sys.exit(1)
    instrument_file(sys.argv[1], sys.argv[2])
