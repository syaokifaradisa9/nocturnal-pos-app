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

    case VIEW_ANY_SUPPLIER = 'Lihat Data Supplier Keseluruhan';
    case VIEW_ASSOCIATED_SUPPLIER = 'Lihat Data Supplier Penempatan Bisnis';
    case VIEW_OWN_SUPPLIER = 'Lihat Data Supplier Pribadi';
    case CREATE_ANY_SUPPLIER = 'Tambah Data Supplier Keseluruhan';
    case CREATE_ASSOCIATED_SUPPLIER = 'Tambah Data Supplier Penempatan Bisnis';
    case CREATE_OWN_SUPPLIER = 'Tambah Data Supplier Pribadi';
    case EDIT_ANY_SUPPLIER = 'Edit Data Supplier Keseluruhan';
    case EDIT_ASSOCIATED_SUPPLIER = 'Edit Data Supplier Penempatan Bisnis';
    case EDIT_OWN_SUPPLIER = 'Edit Data Supplier Pribadi';
    case DELETE_ANY_SUPPLIER = 'Hapus Data Supplier Keseluruhan';
    case DELETE_ASSOCIATED_SUPPLIER = 'Hapus Data Supplier Penempatan Bisnis';
    case DELETE_OWN_SUPPLIER = 'Hapus Data Supplier Pribadi';

    case VIEW_ROLE = 'Lihat Data Role Permisison';
    case CREATE_ROLE = 'Tambah Data Role Permisison';
    case EDIT_ROLE = 'Edit Data Role Permisison';
    case DELETE_ROLE = 'Hapus Data Role Permission';

    case VIEW_ANY_CUSTOMER = 'Lihat Data Customer Keseluruhan';
    case VIEW_ASSOCIATED_CUSTOMER = 'Lihat Data Customer Penempatan Bisnis';
    case VIEW_OWN_CUSTOMER = 'Lihat Data Customer Pribadi';
    case CREATE_ANY_CUSTOMER = 'Tambah Data Customer Keseluruhan';
    case CREATE_ASSOCIATED_CUSTOMER = 'Tambah Data Customer Penempatan Bisnis';
    case CREATE_OWN_CUSTOMER = 'Tambah Data Customer Pribadi';
    case EDIT_ANY_CUSTOMER = 'Edit Data Customer Keseluruhan';
    case EDIT_ASSOCIATED_CUSTOMER = 'Edit Data Customer Penempatan Bisnis';
    case EDIT_OWN_CUSTOMER = 'Edit Data Customer Pribadi';
    case DELETE_ANY_CUSTOMER = 'Hapus Data Customer Keseluruhan';
    case DELETE_ASSOCIATED_CUSTOMER = 'Hapus Data Customer Penempatan Bisnis';
    case DELETE_OWN_CUSTOMER = 'Hapus Data Customer Pribadi';

    case VIEW_ANY_PRODUCT_UNIT = 'Lihat Data Satuan Produk Keseluruhan';
    case VIEW_ASSOCIATED_PRODUCT_UNIT = 'Lihat Data Satuan Produk Penempatan Bisnis';
    case VIEW_OWN_PRODUCT_UNIT = 'Lihat Data Satuan Produk Pribadi';
    case CREATE_ANY_PRODUCT_UNIT = 'Tambah Data Satuan Produk Keseluruhan';
    case CREATE_ASSOCIATED_PRODUCT_UNIT = 'Tambah Data Satuan Produk Penempatan Bisnis';
    case CREATE_OWN_PRODUCT_UNIT = 'Tambah Data Satuan Produk Pribadi';
    case EDIT_ANY_PRODUCT_UNIT = 'Edit Data Satuan Produk Keseluruhan';
    case EDIT_ASSOCIATED_PRODUCT_UNIT = 'Edit Data Satuan Produk Penempatan Bisnis';
    case EDIT_OWN_PRODUCT_UNIT = 'Edit Data Satuan Produk Pribadi';
    case DELETE_ANY_PRODUCT_UNIT = 'Hapus Data Satuan Produk Keseluruhan';
    case DELETE_ASSOCIATED_PRODUCT_UNIT = 'Hapus Data Satuan Produk Penempatan Bisnis';
    case DELETE_OWN_PRODUCT_UNIT = 'Hapus Data Satuan Produk Pribadi';

    case VIEW_ANY_REWARD = 'Lihat Data Reward Keseluruhan';
    case VIEW_ASSOCIATED_REWARD = 'Lihat Data Reward Penempatan Bisnis';
    case VIEW_OWN_REWARD = 'Lihat Data Reward Pribadi';
    case CREATE_ANY_REWARD = 'Tambah Data Reward Keseluruhan';
    case CREATE_ASSOCIATED_REWARD = 'Tambah Data Reward Penempatan Bisnis';
    case CREATE_OWN_REWARD = 'Tambah Data Reward Pribadi';
    case EDIT_ANY_REWARD = 'Edit Data Reward Keseluruhan';
    case EDIT_ASSOCIATED_REWARD = 'Edit Data Reward Penempatan Bisnis';
    case EDIT_OWN_REWARD = 'Edit Data Reward Pribadi';
    case DELETE_ANY_REWARD = 'Hapus Data Reward Keseluruhan';
    case DELETE_ASSOCIATED_REWARD = 'Hapus Data Reward Penempatan Bisnis';
    case DELETE_OWN_REWARD = 'Hapus Data Reward Pribadi';

    case VIEW_ANY_PRODUCT_ITEM = 'Lihat Data Item Produk Keseluruhan';
    case VIEW_ASSOCIATED_PRODUCT_ITEM = 'Lihat Data Item Produk Penempatan Bisnis';
    case VIEW_OWN_PRODUCT_ITEM = 'Lihat Data Item Produk Pribadi';
    case CREATE_ANY_PRODUCT_ITEM = 'Tambah Data Item Produk Keseluruhan';
    case CREATE_ASSOCIATED_PRODUCT_ITEM = 'Tambah Data Item Produk Penempatan Bisnis';
    case CREATE_OWN_PRODUCT_ITEM = 'Tambah Data Item Produk Pribadi';
    case EDIT_ANY_PRODUCT_ITEM = 'Edit Data Item Produk Keseluruhan';
    case EDIT_ASSOCIATED_PRODUCT_ITEM = 'Edit Data Item Produk Penempatan Bisnis';
    case EDIT_OWN_PRODUCT_ITEM = 'Edit Data Item Produk Pribadi';
    case DELETE_ANY_PRODUCT_ITEM = 'Hapus Data Item Produk Keseluruhan';
    case DELETE_ASSOCIATED_PRODUCT_ITEM = 'Hapus Data Item Produk Penempatan Bisnis';
    case DELETE_OWN_PRODUCT_ITEM = 'Hapus Data Item Produk Pribadi';
}
