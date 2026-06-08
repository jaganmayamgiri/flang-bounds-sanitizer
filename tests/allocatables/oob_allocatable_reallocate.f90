! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer, allocatable :: a(:)
  allocate(a(10))
  a = [(i, i=1,10)]
  a = a(1:5)
  print *, a(6)
end program
