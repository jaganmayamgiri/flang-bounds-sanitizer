cmake_minimum_required(VERSION 3.20)
project(FlangBoundsSanitizerBenchmarks LANGUAGES Fortran)

add_executable(jacobi_2d jacobi_2d.f90)
add_executable(gemm gemm.f90)
add_executable(heat_3d heat_3d.f90)
