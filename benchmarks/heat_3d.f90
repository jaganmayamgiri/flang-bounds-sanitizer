program heat_3d
  implicit none
  integer, parameter :: n = 50
  integer, parameter :: steps = 10
  double precision :: a(n, n, n), b(n, n, n)
  integer :: i, j, k, t
  
  do k = 1, n
    do j = 1, n
      do i = 1, n
        a(i, j, k) = (i * j * k + 1.0d0) / n
        b(i, j, k) = (i * j * k + 2.0d0) / n
      end do
    end do
  end do

  do t = 1, steps
    do k = 2, n - 1
      do j = 2, n - 1
        do i = 2, n - 1
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
          a(i, j, k) = b(i, j, k)
        end do
      end do
    end do
  end do

  print *, "Heat 3D checksum:", a(n/2, n/2, n/2)
end program
