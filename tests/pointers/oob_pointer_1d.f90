! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer, target :: a(10) = 0
  integer, pointer :: p(:)
  p => a
  print *, p(11)
end program
