! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 11, valid range: [1, 10]
program main
  implicit none
  integer :: i
  integer :: x(10) = [(i, i=1,10)]
  call sub(x)
contains
  subroutine sub(a)
    integer, intent(in) :: a(:)
    print *, a(11)
  end subroutine
end program
