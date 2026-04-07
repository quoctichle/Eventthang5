// Composable dùng chung ngôn ngữ giữa các trang
// useState của Nuxt tự động chia sẻ state qua các component/page trong cùng session

export const useLang = () => useState<'ja' | 'en' | 'vi' | 'my'>('lang', () => 'ja')

export const i18nData = {
  ja: {
    title: "ラッキールーレット",
    won: "当選しました！",
    note: "コードごとに1回のみ抽選可能です。賞品の受け取りについては主催者にお問い合わせください。",
    spin: "回す",
    spinning: "回転中...",
    spin_now: "🎰 今すぐ回す",
    empty: "賞品が設定されていません。",
    congrats: "おめでとうございます！",
    close: "閉じる",
    out_of_prizes: "賞品がありません！",
    error: "エラーが発生しました。もう一度お試しください！",
    enter_new_code: "別のコードを入力",
    // access page
    access_title: "アクセスコードを入力",
    access_desc: "続けるには主催者から発行されたコードを入力してください。",
    access_placeholder: "コードをここに入力...",
    access_btn: "続ける →",
    access_loading: "確認中...",
    access_error_default: "コードが無効です"
  },
  vi: {
    title: "Vòng Quay May Mắn",
    won: "Bạn đã trúng giải!",
    note: "Mỗi mã chỉ được quay 1 lần. Liên hệ BTC để nhận giải.",
    spin: "QUAY",
    spinning: "Đang quay...",
    spin_now: "🎰 QUAY NGAY",
    empty: "Chưa có giải thưởng nào được cấu hình.",
    congrats: "Chúc mừng!",
    close: "Đóng",
    out_of_prizes: "Đã hết giải thưởng tặng kèm!",
    error: "Có lỗi xảy ra, vui lòng thử lại!",
    enter_new_code: "Nhập mã khác",
    // access page
    access_title: "Nhập mã truy cập",
    access_desc: "Vui lòng nhập mã do ban tổ chức cấp để tiếp tục.",
    access_placeholder: "Nhập mã tại đây...",
    access_btn: "Tiếp tục →",
    access_loading: "Đang kiểm tra...",
    access_error_default: "Mã không hợp lệ"
  },
  en: {
    title: "Lucky Spin Wheel",
    won: "You've won a prize!",
    note: "Each code can only be spun once. Contact the organizer to claim your prize.",
    spin: "SPIN",
    spinning: "Spinning...",
    spin_now: "🎰 SPIN NOW",
    empty: "No prizes have been configured.",
    congrats: "Congratulations!",
    close: "Close",
    out_of_prizes: "No prizes left!",
    error: "An error occurred, please try again!",
    enter_new_code: "Enter another code",
    // access page
    access_title: "Enter Access Code",
    access_desc: "Please enter the code provided by the organizer to continue.",
    access_placeholder: "Enter code here...",
    access_btn: "Continue →",
    access_loading: "Checking...",
    access_error_default: "Invalid code"
  },
  my: {
    title: "ကံစမ်းမဲဘီး",
    won: "သင်ဆုရသွားပါပြီ!",
    note: "ကုဒ်တစ်ခုလျှင်တစ်ကြိမ်သာလှည့်နိုင်သည်။ ဆုထုတ်ယူရန် စီစဉ်သူအား ဆက်သွယ်ပါ။",
    spin: "လှည့်မည်",
    spinning: "လှည့်နေသည်...",
    spin_now: "🎰 ယခုလှည့်မည်",
    empty: "ဆုများကို သတ်မှတ်ထားခြင်းမရှိပါ။",
    congrats: "ဂုဏ်ယူပါတယ်!",
    close: "ပိတ်မည်",
    out_of_prizes: "ဆုများကုန်သွားပါပြီ!",
    error: "အမှားအယွင်းတစ်ခုဖြစ်ပွားခဲ့သည်၊ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ!",
    enter_new_code: "အခြားကုဒ်ရိုက်ထည့်ပါ",
    // access page
    access_title: "ဝင်ရောက်ခွင့်ကုဒ် ရိုက်ထည့်ပါ",
    access_desc: "ဆက်လက်ဆောင်ရွက်ရန် စီစဉ်သူထံမှ ပေးသောကုဒ်ကို ရိုက်ထည့်ပါ။",
    access_placeholder: "ကုဒ်ကို ဤနေရာတွင် ရိုက်ထည့်ပါ...",
    access_btn: "ဆက်လက်ဆောင်ရွက်မည် →",
    access_loading: "စစ်ဆေးနေသည်...",
    access_error_default: "ကုဒ်မမှန်ကန်ပါ"
  }
}

export const flags: Record<string, string> = {
  ja: '/nhat.png',
  en: '/anh.png',
  vi: '/viet.png',
  my: '/myanma.png'
}
