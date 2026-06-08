! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer, target :: a(10) = 0
  integer, pointer :: p(:,:) => null()
  p(1:2, 1:5) => a
  print *, p(1, 6)
end program
