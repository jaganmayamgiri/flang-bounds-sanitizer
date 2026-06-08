! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array index out of bounds
program main
  integer, allocatable :: a(:,:)
  allocate(a(10, 10))
  print *, a(5, 11)
end program
