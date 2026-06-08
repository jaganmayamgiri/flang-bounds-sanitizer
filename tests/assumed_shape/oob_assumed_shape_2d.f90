! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 2, index: 6, valid range: [1, 5]
program main
  implicit none
  integer :: x(5, 5) = 0
  call sub(x)
contains
  subroutine sub(a)
    integer, intent(in) :: a(:,:)
    print *, a(2, 6)
  end subroutine
end program
