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
}
