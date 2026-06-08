module FortranBoundsCheck
  use iso_c_binding
  implicit none

  interface
    subroutine FortranABoundsCheck(descriptor, dimension, index, source_file, source_line) bind(C, name="_FortranABoundsCheck")
      import
      type(*), dimension(..), target :: descriptor
      integer(c_int), value :: dimension
      integer(c_intptr_t), value :: index
      character(kind=c_char), dimension(*), target :: source_file
      integer(c_int), value :: source_line
    end subroutine

    subroutine FortranABoundsCheckSection(descriptor, dimension, section_lower, section_upper, stride, source_file, source_line) bind(C, name="_FortranABoundsCheckSection")
      import
      type(*), dimension(..), target :: descriptor
      integer(c_int), value :: dimension
      integer(c_intptr_t), value :: section_lower
      integer(c_intptr_t), value :: section_upper
      integer(c_intptr_t), value :: stride
      character(kind=c_char), dimension(*), target :: source_file
      integer(c_int), value :: source_line
    end subroutine

    subroutine FortranABoundsCheckAssociated(descriptor, source_file, source_line) bind(C, name="_FortranABoundsCheckAssociated")
      import
      type(*), dimension(..), target :: descriptor
      character(kind=c_char), dimension(*), target :: source_file
      integer(c_int), value :: source_line
    end subroutine
  end interface
end module FortranBoundsCheck
