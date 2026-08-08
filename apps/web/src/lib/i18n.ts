import { writable } from 'svelte/store';

export type Language = 'id' | 'en';

const initialLang: Language = (typeof localStorage !== 'undefined' && localStorage.getItem('pockt-lang') as Language) || 'id';

export const currentLang = writable<Language>(initialLang);

if (typeof localStorage !== 'undefined') {
  currentLang.subscribe((lang) => {
    localStorage.setItem('pockt-lang', lang);
  });
}

export function toggleLang() {
  currentLang.update((prev) => (prev === 'id' ? 'en' : 'id'));
}

export const translations = {
  id: {
    // Layout & Nav
    nav_timeline: 'Timeline & Status',
    nav_payday: 'Payday View',
    nav_incomes: 'Pemasukan',
    nav_expenses: 'Pengeluaran',
    nav_bills: 'Tagihan',
    nav_debts: 'Hutang',
    quick_add: 'Catat Transaksi',
    export_csv: 'Export CSV',
    logout: 'Keluar (Logout)',
    switch_theme_dark: 'Dark Mode (Aurora)',
    switch_theme_light: 'Light Mode (Bloom)',
    lang_label: 'Bahasa: Indonesia',

    // Dashboard
    hero_title: 'Free to Spend Today',
    hero_subtitle: 'Uang bersih aman yang bebas dipakai belanja atau ditabung hari ini.',
    stat_income: 'Pemasukan Bulan Ini',
    stat_expenses: 'Pengeluaran Bulan Ini',
    stat_bills: 'Tagihan Belum Lunas',
    stat_debt: 'Total Sisa Hutang',
    timeline_feed: 'Timeline Alur Keuangan',
    timeline_desc: 'Semua transaksi pemasukan, pengeluaran, dan pembayaran angsuran.',

    // Payday
    payday_title: 'Payday Allocation View',
    payday_subtitle: 'Analisis dan alokasikan gaji kamu untuk komitmen wajib sebelum belanja.',
    payday_total_salary: 'Total Gaji / Pemasukan Bulan Ini',
    payday_scheduled: 'Kewajiban & Komitmen Terjadwal',
    payday_unpaid_bills: 'tagihan belum dibayar',
    payday_active_debts: 'catatan hutang aktif',
    payday_spent_this_month: 'Total belanja bulan ini',
    payday_final_net: 'HASIL AKHIR: NET DISPOSABLE INCOME',

    // Incomes
    incomes_title: 'Kelola Pemasukan',
    incomes_subtitle: 'Catat gaji, bonus, freelance, atau pengembalian dana.',
    add_income: 'Tambah Pemasukan',

    // Expenses
    expenses_title: 'Kelola Pengeluaran',
    expenses_subtitle: 'Catat transaksi harian dengan cepat dalam waktu kurang dari 10 detik.',
    add_expense: 'Catat Pengeluaran',

    // Bills
    bills_title: 'Kelola Tagihan Bulanan',
    bills_subtitle: 'Pantau kewajiban tetap bulanan seperti sewa, listrik, internet, dan langganan.',
    add_bill: 'Tambah Tagihan',
    reset_bills: 'Reset Bulan Baru',

    // Debts
    debts_title: 'Catatan Hutang & Pinjaman',
    debts_subtitle: 'Pantau kewajiban hutang kepada pihak lain dan riwayat pelunasan.',
    add_debt: 'Catat Hutang Baru',

    // Auth & Login
    login_title: 'Masuk ke Pockt',
    setup_title: 'First-Time Setup — Buat Akun Pemilik',
    login_desc: 'Masukkan username dan password kamu untuk mengakses catatan keuangan.',
    setup_desc: 'Sistem belum memiliki pemilik. Buat kredensial akun kamu untuk pertama kali.',
    username: 'Username',
    password: 'Password',
    confirm_password: 'Konfirmasi Password',
    btn_login: 'Masuk ke Pockt',
    btn_setup: 'Buat Akun Pemilik',
  },
  en: {
    // Layout & Nav
    nav_timeline: 'Timeline & Feed',
    nav_payday: 'Payday View',
    nav_incomes: 'Incomes',
    nav_expenses: 'Expenses',
    nav_bills: 'Bills',
    nav_debts: 'Debts & Loans',
    quick_add: 'Record Transaction',
    export_csv: 'Export CSV',
    logout: 'Sign Out (Logout)',
    switch_theme_dark: 'Dark Mode (Aurora)',
    switch_theme_light: 'Light Mode (Bloom)',
    lang_label: 'Language: English',

    // Dashboard
    hero_title: 'Free to Spend Today',
    hero_subtitle: 'Clean spendable cash that is safe to spend or save today.',
    stat_income: 'Monthly Incomes',
    stat_expenses: 'Monthly Expenses',
    stat_bills: 'Unpaid Bills',
    stat_debt: 'Remaining Debt',
    timeline_feed: 'Financial Timeline Feed',
    timeline_desc: 'Unified chronological log of incomes, expenses, and loan payments.',

    // Payday
    payday_title: 'Payday Allocation View',
    payday_subtitle: 'Analyze and allocate salary towards mandatory commitments before spending.',
    payday_total_salary: 'Total Monthly Salary / Incomes',
    payday_scheduled: 'Scheduled Obligations & Commitments',
    payday_unpaid_bills: 'unpaid bills remaining',
    payday_active_debts: 'active debt records',
    payday_spent_this_month: 'Total expenses this month',
    payday_final_net: 'FINAL RESULT: NET DISPOSABLE INCOME',

    // Incomes
    incomes_title: 'Manage Incomes',
    incomes_subtitle: 'Track salary, bonuses, freelance gigs, or refunds.',
    add_income: 'Add Income',

    // Expenses
    expenses_title: 'Manage Expenses',
    expenses_subtitle: 'Record daily expenses quickly in less than 10 seconds.',
    add_expense: 'Record Expense',

    // Bills
    bills_title: 'Manage Monthly Bills',
    bills_subtitle: 'Track fixed monthly obligations like rent, utilities, internet, and subscriptions.',
    add_bill: 'Add Bill',
    reset_bills: 'Reset New Month',

    // Debts
    debts_title: 'Debts & Loans Register',
    debts_subtitle: 'Track liabilities owed to third parties and installment repayment history.',
    add_debt: 'Record New Debt',

    // Auth & Login
    login_title: 'Sign In to Pockt',
    setup_title: 'First-Time Setup — Create Owner Credentials',
    login_desc: 'Enter your username and password to access your financial records.',
    setup_desc: 'No owner account found. Create your owner credentials for the first time.',
    username: 'Username',
    password: 'Password',
    confirm_password: 'Confirm Password',
    btn_login: 'Sign In to Pockt',
    btn_setup: 'Create Owner Account',
  },
};
