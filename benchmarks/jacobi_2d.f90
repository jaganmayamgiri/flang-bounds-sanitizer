program jacobi_2d
  implicit none
  integer, parameter :: n = 200
  integer, parameter :: steps = 20
  double precision :: a(n, n), b(n, n)
  integer :: i, j, t
  
  do j = 1, n
    do i = 1, n
      a(i, j) = (i * (j + 1) + 1.0d0) / n
      b(i, j) = (i * (j + 2) + 2.0d0) / n
    end do
  end do

  do t = 1, steps
    do j = 2, n - 1
      do i = 2, n - 1
        b(i, j) = 0.2d0 * (a(i, j) + a(i - 1, j) + a(i + 1, j) + a(i, j - 1) + a(i, j + 1))
      end do
    end do
    do j = 2, n - 1
      do i = 2, n - 1
        a(i, j) = b(i, j)
      end do
    end do
  end do

  print *, "Jacobi 2D checksum:", a(n/2, n/2)
end program
