! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
! CHECK: dimension: 1, index: 6, valid range: [1, 5]
program main
  implicit none
  integer :: i
  integer :: x(10) = [(i, i=1,10)]
  call sub(x(1:10:2))
contains
  subroutine sub(a)
    integer, intent(in) :: a(:)
    print *, a(6)
  end subroutine
end program
