! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 4, valid range: [5, 14]
program main
  implicit none
  integer :: x(10) = 0
  call sub(x)
contains
  subroutine sub(a)
    integer, intent(in) :: a(5:)
    print *, a(4)
  end subroutine
end program
