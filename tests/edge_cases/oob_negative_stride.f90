! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer :: a(10) = [(i, i=1,10)]
  print *, a(10:0:-1)
end program
