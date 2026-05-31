<?php

namespace App\Enums;

enum UserPermission: string
{
    case VIEW_ANY_BUSINESS = 'Lihat Data Bisnis Keseluruhan';
    case VIEW_OWN_BUSINESS = 'Lihat Data Bisnis Pribadi';
    case CREATE_ANY_BUSINESS = 'Tambah Data Bisnis Keseluruhan';
    case CREATE_OWN_BUSINESS = 'Tambah Data Bisnis Pribadi';
    case EDIT_ANY_BUSINESS = 'Edit Data Bisnis Keseluruhan';
    case EDIT_OWN_BUSINESS = 'Edit Data Bisnis Pribadi';
    case DELETE_ANY_BUSINESS = 'Hapus Data Bisnis Keseluruhan';
    case DELETE_OWN_BUSINESS = 'Hapus Data Bisnis Pribadi';

    case VIEW_ANY_BRANCH = 'Lihat Data Cabang Keseluruhan';
    case VIEW_ASSOCIATED_BRANCH = 'Lihat Data Cabang Penanggungjawab Bisnis';
    case VIEW_OWN_BRANCH = 'Lihat Data Cabang Pribadi';
    case CREATE_ANY_BRANCH = 'Tambah Data Cabang Keseluruhan';
    case CREATE_ASSOCIATED_BRANCH = 'Tambah Data Cabang Penanggungjawab Bisnis';
    case CREATE_OWN_BRANCH = 'Tambah Data Cabang Pribadi';
    case EDIT_ANY_BRANCH = 'Edit Data Cabang Keseluruhan';
    case EDIT_ASSOCIATED_BRANCH = 'Edit Data Cabang Penanggungjawab Bisnis';
    case EDIT_OWN_BRANCH = 'Edit Data Cabang Pribadi';
    case DELETE_ANY_BRANCH = 'Hapus Data Cabang Keseluruhan';
    case DELETE_ASSOCIATED_BRANCH = 'Hapus Data Cabang Penanggungjawab Bisnis';
    case DELETE_OWN_BRANCH = 'Hapus Data Cabang Pribadi';

    case VIEW_ANY_PRODUCT = 'Lihat Data Produk Keseluruhan';
    case VIEW_ASSOCIATED_PRODUCT = 'Lihat Data Produk Penempatan Bisnis';
    case VIEW_OWN_PRODUCT = 'Lihat Data Produk Pribadi';
    case CREATE_ANY_PRODUCT = 'Tambah Data Produk Keseluruhan';
    case CREATE_ASSOCIATED_PRODUCT = 'Tambah Data Produk Penempatan Bisnis';
    case CREATE_OWN_PRODUCT = 'Tambah Data Produk Pribadi';
    case EDIT_ANY_PRODUCT = 'Edit Data Produk Keseluruhan';
    case EDIT_ASSOCIATED_PRODUCT = 'Edit Data Produk Penempatan Bisnis';
    case EDIT_OWN_PRODUCT = 'Edit Data Produk Pribadi';
    case DELETE_ANY_PRODUCT = 'Hapus Data Produk Keseluruhan';
    case DELETE_ASSOCIATED_PRODUCT = 'Hapus Data Produk Penempatan Bisnis';
    case DELETE_OWN_PRODUCT = 'Hapus Data Produk Pribadi';
}
