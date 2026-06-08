program jacobi_2d
  use BoundsCheckModule
  implicit none
  integer, parameter :: n = 200
  integer, parameter :: steps = 20
  double precision :: a(n, n), b(n, n)
  integer :: i, j, t
  
  character(len=25, kind=c_char), target, save :: src_file = c_char_"benchmarks/jacobi_2d.f90" // c_null_char
  do j = 1, n
    do i = 1, n
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 10)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 10)
      a(i, j) = (i * (j + 1) + 1.0d0) / n
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 11)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 11)
      b(i, j) = (i * (j + 2) + 2.0d0) / n
    end do
  end do

  do t = 1, steps
    do j = 2, n - 1
      do i = 2, n - 1
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 18)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 18)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 18)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 18)
  if (i - 1 < lbound(a, 1) .or. i - 1 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i - 1, 8), int(lbound(a, 1), 8), src_file, 18)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 18)
  if (i + 1 < lbound(a, 1) .or. i + 1 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i + 1, 8), int(lbound(a, 1), 8), src_file, 18)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 18)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 18)
  if (j - 1 < lbound(a, 2) .or. j - 1 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j - 1, 8), int(lbound(a, 2), 8), src_file, 18)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 18)
  if (j + 1 < lbound(a, 2) .or. j + 1 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j + 1, 8), int(lbound(a, 2), 8), src_file, 18)
        b(i, j) = 0.2d0 * (a(i, j) + a(i - 1, j) + a(i + 1, j) + a(i, j - 1) + a(i, j + 1))
      end do
    end do
    do j = 2, n - 1
      do i = 2, n - 1
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 23)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 23)
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 23)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 23)
        a(i, j) = b(i, j)
      end do
    end do
  end do

  if (n/2 < lbound(a, 1) .or. n/2 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(n/2, 8), int(lbound(a, 1), 8), src_file, 28)
  if (n/2 < lbound(a, 2) .or. n/2 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(n/2, 8), int(lbound(a, 2), 8), src_file, 28)
  print *, "Jacobi 2D checksum:", a(n/2, n/2)
end program
