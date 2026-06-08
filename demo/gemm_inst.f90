program gemm
  use BoundsCheckModule
  implicit none
  integer, parameter :: ni = 100, nj = 100, nk = 100
  double precision :: alpha, beta
  double precision :: a(ni, nk), b(nk, nj), c(ni, nj)
  integer :: i, j, k
  
  character(len=20, kind=c_char), target, save :: src_file = c_char_"benchmarks/gemm.f90" // c_null_char
  alpha = 1.5d0
  beta = 1.2d0

  do i = 1, ni
    do j = 1, nk
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 13)
  if (j < lbound(a, 2) .or. j > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(j, 8), int(lbound(a, 2), 8), src_file, 13)
      a(i, j) = (i * j + 1.0d0) / ni
    end do
  end do
  do i = 1, nk
    do j = 1, nj
  if (i < lbound(b, 1) .or. i > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(i, 8), int(lbound(b, 1), 8), src_file, 18)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 18)
      b(i, j) = (i * (j + 1) + 2.0d0) / nj
    end do
  end do
  do i = 1, ni
    do j = 1, nj
  if (i < lbound(c, 1) .or. i > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(i, 8), int(lbound(c, 1), 8), src_file, 23)
  if (j < lbound(c, 2) .or. j > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(j, 8), int(lbound(c, 2), 8), src_file, 23)
      c(i, j) = (i * (j + 2) + 3.0d0) / ni
    end do
  end do

  do i = 1, ni
    do j = 1, nj
  if (i < lbound(c, 1) .or. i > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(i, 8), int(lbound(c, 1), 8), src_file, 29)
  if (j < lbound(c, 2) .or. j > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(j, 8), int(lbound(c, 2), 8), src_file, 29)
  if (i < lbound(c, 1) .or. i > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(i, 8), int(lbound(c, 1), 8), src_file, 29)
  if (j < lbound(c, 2) .or. j > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(j, 8), int(lbound(c, 2), 8), src_file, 29)
      c(i, j) = c(i, j) * beta
      do k = 1, nk
  if (i < lbound(c, 1) .or. i > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(i, 8), int(lbound(c, 1), 8), src_file, 31)
  if (j < lbound(c, 2) .or. j > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(j, 8), int(lbound(c, 2), 8), src_file, 31)
  if (i < lbound(c, 1) .or. i > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(i, 8), int(lbound(c, 1), 8), src_file, 31)
  if (j < lbound(c, 2) .or. j > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(j, 8), int(lbound(c, 2), 8), src_file, 31)
  if (i < lbound(a, 1) .or. i > ubound(a, 1)) call FortranABoundsCheck(a, 0, int(i, 8), int(lbound(a, 1), 8), src_file, 31)
  if (k < lbound(a, 2) .or. k > ubound(a, 2)) call FortranABoundsCheck(a, 1, int(k, 8), int(lbound(a, 2), 8), src_file, 31)
  if (k < lbound(b, 1) .or. k > ubound(b, 1)) call FortranABoundsCheck(b, 0, int(k, 8), int(lbound(b, 1), 8), src_file, 31)
  if (j < lbound(b, 2) .or. j > ubound(b, 2)) call FortranABoundsCheck(b, 1, int(j, 8), int(lbound(b, 2), 8), src_file, 31)
        c(i, j) = c(i, j) + alpha * a(i, k) * b(k, j)
      end do
    end do
  end do

  if (ni/2 < lbound(c, 1) .or. ni/2 > ubound(c, 1)) call FortranABoundsCheck(c, 0, int(ni/2, 8), int(lbound(c, 1), 8), src_file, 36)
  if (nj/2 < lbound(c, 2) .or. nj/2 > ubound(c, 2)) call FortranABoundsCheck(c, 1, int(nj/2, 8), int(lbound(c, 2), 8), src_file, 36)
  print *, "GEMM checksum:", c(ni/2, nj/2)
end program
