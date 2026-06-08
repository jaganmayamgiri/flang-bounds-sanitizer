! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array not associated or allocated
program main
  integer, allocatable :: a(:)
  allocate(a(10))
  deallocate(a)
  print *, a(1)
end program
