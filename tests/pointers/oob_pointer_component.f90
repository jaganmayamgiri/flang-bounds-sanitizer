! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  type my_type
    integer, pointer :: p(:) => null()
  end type
  type(my_type) :: t
  integer, target :: a(5) = 0
  t%p => a
  print *, t%p(6)
end program
