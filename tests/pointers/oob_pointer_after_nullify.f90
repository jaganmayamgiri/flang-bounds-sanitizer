! RUN: %flang -fcheck=bounds %s -o %t && not %t 2>&1 | FileCheck %s
! CHECK: array not associated or allocated
program main
  integer, pointer :: p(:) => null()
  nullify(p)
  print *, p(1)
end program
