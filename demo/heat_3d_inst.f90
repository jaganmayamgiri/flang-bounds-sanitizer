program heat_3d
  use BoundsCheckModule
  implicit none
  integer, parameter :: n = 50
  integer, parameter :: steps = 10
  double precision :: a(n, n, n), b(n, n, n)
  integer :: i, j, k, t
  
  character(len=23, kind=c_char), target, save :: src_file = c_char_"benchmarks/heat_3d.f90" // c_null_char
  do k = 1, n
    do j = 1, n
      do i = 1, n
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 11)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 11)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 11)
        a(i, j, k) = (i * j * k + 1.0d0) / n
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 12)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 12)
  if (k < lbound(b, 3) .or. k > ubound(b, 3)) call FortranABoundsCheck(b, 2, int(k, 8), int(lbound(b, 3), 8), src_file, 12)
        b(i, j, k) = (i * j * k + 2.0d0) / n
      end do
    end do
  end do

  do t = 1, steps
    do k = 2, n - 1
      do j = 2, n - 1
        do i = 2, n - 1
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 21)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 21)
  if (k < lbound(b, 3) .or. k > ubound(b, 3)) call FortranABoundsCheck(b, 2, int(k, 8), int(lbound(b, 3), 8), src_file, 21)
  if (i+1 < lbound(a, 1) .or. i+1 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i+1, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i-1 < lbound(a, 1) .or. i-1 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i-1, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j+1 < lbound(a, 2) .or. j+1 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j+1, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j-1 < lbound(a, 2) .or. j-1 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j-1, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k+1 < lbound(a, 3) .or. k+1 > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k+1, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k-1 < lbound(a, 3) .or. k-1 > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k-1, 8), int(lbound(a, 3), 8), src_file, 21)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 21)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 21)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 21)
          b(i, j, k) = 0.125d0 * (a(i+1, j, k) - 2.0d0 * a(i, j, k) + a(i-1, j, k)) + &
                       0.125d0 * (a(i, j+1, k) - 2.0d0 * a(i, j, k) + a(i, j-1, k)) + &
                       0.125d0 * (a(i, j, k+1) - 2.0d0 * a(i, j, k) + a(i, j, k-1)) + &
                       a(i, j, k)
        end do
      end do
    end do
    do k = 2, n - 1
      do j = 2, n - 1
        do i = 2, n - 1
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 31)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 31)
  if (k < lbound(a, 3) .or. k > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(k, 8), int(lbound(a, 3), 8), src_file, 31)
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 31)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 31)
  if (k < lbound(b, 3) .or. k > ubound(b, 3)) call FortranABoundsCheck(b, 2, int(k, 8), int(lbound(b, 3), 8), src_file, 31)
          a(i, j, k) = b(i, j, k)
        end do
      end do
    end do
  end do

  if (n/2 < lbound(a, 1) .or. n/2 > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(n/2, 8), int(lbound(a, 1), 8), src_file, 37)
  if (n/2 < lbound(a, 2) .or. n/2 > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(n/2, 8), int(lbound(a, 2), 8), src_file, 37)
  if (n/2 < lbound(a, 3) .or. n/2 > ubound(a, 3)) call FortranABoundsCheck(a, 2, int(n/2, 8), int(lbound(a, 3), 8), src_file, 37)
  print *, "Heat 3D checksum:", a(n/2, n/2, n/2)
end program
