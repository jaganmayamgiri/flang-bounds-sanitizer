#ifndef BOUNDS_SHIM_H
#define BOUNDS_SHIM_H

#include <ISO_Fortran_binding.h>

#ifdef __cplusplus
extern "C" {
#endif

void _FortranABoundsCheck(
    const CFI_cdesc_t *descriptor,
    int           dimension,
    CFI_index_t   index,
    CFI_index_t   fortran_lb,
    const char   *source_file,
    int           source_line
);

void _FortranABoundsCheckSection(
    const CFI_cdesc_t *descriptor,
    int           dimension,
    CFI_index_t   section_lower,
    CFI_index_t   section_upper,
    CFI_index_t   stride,
    CFI_index_t   fortran_lb,
    const char   *source_file,
    int           source_line
);

void _FortranABoundsCheckAssociated(
    const CFI_cdesc_t *descriptor,
    const char        *source_file,
    int                source_line
);

#ifdef __cplusplus
}
#endif

#endif // BOUNDS_SHIM_H
