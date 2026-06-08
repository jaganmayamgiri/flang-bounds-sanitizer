! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer :: a(0)
  print *, a(1)
end program
