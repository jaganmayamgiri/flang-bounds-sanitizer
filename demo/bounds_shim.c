#include "bounds_shim.h"
#include <stdio.h>
#include <stdlib.h>

void _FortranABoundsCheck(
    const CFI_cdesc_t *descriptor,
    int           dimension,
    CFI_index_t   index,
    CFI_index_t   fortran_lb,
    const char   *source_file,
    int           source_line
) {
    _FortranABoundsCheckAssociated(descriptor, source_file, source_line);

    if (dimension < 0 || dimension >= descriptor->rank) {
        fprintf(stderr, "Fortran runtime error: bounds check dimension %d is out of range for rank %d\n",
                dimension + 1, descriptor->rank);
        abort();
    }

    CFI_index_t lb = fortran_lb;
    CFI_index_t extent = descriptor->dim[dimension].extent;
    CFI_index_t ub = lb + extent - 1;

    if (extent <= 0 || index < lb || index > ub) {
        fprintf(stderr, "Fortran runtime error: array index out of bounds\n");
        fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
        if (extent <= 0) {
            fprintf(stderr, "  dimension: %d, index: %ld, valid range: [empty]\n",
                    dimension + 1, (long)index);
        } else {
            fprintf(stderr, "  dimension: %d, index: %ld, valid range: [%ld, %ld]\n",
                    dimension + 1, (long)index, (long)lb, (long)ub);
        }
        fprintf(stderr, "  array: CFI rank=%d, extents=[", descriptor->rank);
        for (int r = 0; r < descriptor->rank; r++) {
            fprintf(stderr, "%ld%s", (long)descriptor->dim[r].extent, (r == descriptor->rank - 1) ? "" : ",");
        }
        fprintf(stderr, "]\n");
        abort();
    }
}

void _FortranABoundsCheckSection(
    const CFI_cdesc_t *descriptor,
    int           dimension,
    CFI_index_t   section_lower,
    CFI_index_t   section_upper,
    CFI_index_t   stride,
    CFI_index_t   fortran_lb,
    const char   *source_file,
    int           source_line
) {
    _FortranABoundsCheckAssociated(descriptor, source_file, source_line);

    if (dimension < 0 || dimension >= descriptor->rank) {
        fprintf(stderr, "Fortran runtime error: bounds check dimension %d is out of range for rank %d\n",
                dimension + 1, descriptor->rank);
        abort();
    }

    CFI_index_t lb = fortran_lb;
    CFI_index_t extent = descriptor->dim[dimension].extent;
    CFI_index_t ub = lb + extent - 1;

    if (extent <= 0) {
        fprintf(stderr, "Fortran runtime error: array index out of bounds\n");
        fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
        fprintf(stderr, "  dimension: %d, section bounds: [%ld, %ld], valid range: [empty]\n",
                dimension + 1, (long)section_lower, (long)section_upper);
        abort();
    }

    int is_empty = 0;
    if (stride > 0 && section_lower > section_upper) {
        is_empty = 1;
    } else if (stride < 0 && section_lower < section_upper) {
        is_empty = 1;
    }

    if (!is_empty) {
        CFI_index_t first = section_lower;
        CFI_index_t last = section_lower + ((section_upper - section_lower) / stride) * stride;

        CFI_index_t min_idx = (first < last) ? first : last;
        CFI_index_t max_idx = (first > last) ? first : last;

        if (min_idx < lb || max_idx > ub) {
            fprintf(stderr, "Fortran runtime error: array index out of bounds\n");
            fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
            fprintf(stderr, "  dimension: %d, index range: [%ld, %ld], valid range: [%ld, %ld]\n",
                    dimension + 1, (long)min_idx, (long)max_idx, (long)lb, (long)ub);
            fprintf(stderr, "  array: CFI rank=%d, extents=[", descriptor->rank);
            for (int r = 0; r < descriptor->rank; r++) {
                fprintf(stderr, "%ld%s", (long)descriptor->dim[r].extent, (r == descriptor->rank - 1) ? "" : ",");
            }
            fprintf(stderr, "]\n");
            abort();
        }
    }
}

void _FortranABoundsCheckAssociated(
    const CFI_cdesc_t *descriptor,
    const char        *source_file,
    int                source_line
) {
    if (descriptor == NULL || descriptor->base_addr == NULL) {
        fprintf(stderr, "Fortran runtime error: array not associated or allocated\n");
        fprintf(stderr, "  file: %s, line: %d\n", source_file, source_line);
        abort();
    }
}
