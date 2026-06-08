program gemm
  implicit none
  integer, parameter :: ni = 100, nj = 100, nk = 100
  double precision :: alpha, beta
  double precision :: a(ni, nk), b(nk, nj), c(ni, nj)
  integer :: i, j, k
  
  alpha = 1.5d0
  beta = 1.2d0

  do i = 1, ni
    do j = 1, nk
      a(i, j) = (i * j + 1.0d0) / ni
    end do
  end do
  do i = 1, nk
    do j = 1, nj
      b(i, j) = (i * (j + 1) + 2.0d0) / nj
    end do
  end do
  do i = 1, ni
    do j = 1, nj
      c(i, j) = (i * (j + 2) + 3.0d0) / ni
    end do
  end do

  do i = 1, ni
    do j = 1, nj
      c(i, j) = c(i, j) * beta
      do k = 1, nk
        c(i, j) = c(i, j) + alpha * a(i, k) * b(k, j)
      end do
    end do
  end do

  print *, "GEMM checksum:", c(ni/2, nj/2)
end program
