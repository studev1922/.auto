/**
 * @typedef {Object} UDat
 * @property {Object} nes - Các thông tin cần thiết để gửi truy vấn GraphQL.
 * @property {?string} nes.__a - Cờ tùy chọn, thường là `null` hoặc `'1'`.
 * @property {?string} nes.__comet_req - Tham số đi kèm với yêu cầu.
 * @property {?string} nes.__user - ID người dùng.
 * @property {?string} nes.fb_dtsg - Token chống CSRF.
 * @property {?string} cookie - Chuỗi cookie để xác thực.
 */

/**
 * @typedef {'photo' | 'media'} AttachKey
 * @typedef {Object} ResPhoto
 * @property {?number} id - ID của ảnh.
 * @property {?string} src - Đường dẫn ảnh.
 */

/**
 * @typedef {'input' | 'number' | 'confirm' | 'list' | 'rawlist' | 'expand' | 'checkbox' | 'password' | 'editor'} InquirerType
 * @typedef {'timeline' | 'group'} RenderLocation
 * @typedef {Object} PostValue
 * @property {?string} pathImages - Đường dẫn đến ảnh.
 * @property {?string} textToPost - Nội dung bài viết.
 */