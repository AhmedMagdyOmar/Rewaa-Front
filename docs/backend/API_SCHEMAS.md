# Rewaa Platform - API Contract (Phase 2: Request & Response Schemas)

> **Phase**: Phase 2 of API Contract Delivery
> **Scope**: Website & Student Portal (28 routes), Provider Dashboard (151 routes), General / Shared (4 routes)
> **Exclusions**: Admin Dashboard (Super Admin) is excluded per user instruction.
> **File Modification Status**: Documentation ONLY - No project code modified.

---

## 1. Global Envelope & Protocol Specifications

### 1.1 HTTP Headers Contract

| Header Name       | Value                                       | Required             | Purpose                                                   |
| :---------------- | :------------------------------------------ | :------------------- | :-------------------------------------------------------- |
| `Authorization`   | `Bearer <access_token>`                     | For Protected Routes | Laravel Sanctum personal access token                     |
| `Accept-Language` | `ar` or `en`                                | Recommended          | Directs`App\Http\Middleware\SetLocale` to select language |
| `Accept`          | `application/json`                          | Always               | Enforces JSON response from Laravel exception handlers    |
| `Content-Type`    | `application/json` or `multipart/form-data` | On POST/PUT/PATCH    | Required for payload parsing (multipart for files)        |

### 1.2 Standard Success Envelope (`App\Support\ApiResponse::success`)

HTTP Status: `200 OK` or `201 Created`

```json
{
  "status": 200,
  "message": "Operation executed successfully.",
  "data": { ... }
}
```

### 1.3 Standard Error Envelope (`App\Support\ApiResponse::fail` & Validation)

HTTP Status: `422 Unprocessable Content` (Validation Error):

```json
{
  "status": 422,
  "message": "Validation Error",
  "data": null,
  "errors": {
    "email": ["The email has already been taken."],
    "title.ar": ["The Arabic title is required."]
  }
}
```

HTTP Status: `401 Unauthorized`:

```json
{
  "status": 401,
  "message": "Unauthenticated, you have to login first",
  "data": null
}
```

---

## 2. General & Shared APIs (4 Endpoints)

### `GET|HEAD` `/api/general/countries`

- **Action**: `App\Http\Controllers\Api\General\Country\CountryController`
- **Response Resource**: `ApiResponse`

### `GET|HEAD` `/api/general/faqs`

- **Action**: `App\Http\Controllers\Api\General\Faq\FaqController`
- **Response Resource**: `ApiResponse`

### `GET|HEAD` `/api/general/geocode`

- **Action**: `App\Http\Controllers\Api\General\GoogleMap\GeocodeController@show`
- **Response Resource**: `ApiResponse`

### `GET|HEAD` `/api/general/static-pages/{type}`

- **Action**: `App\Http\Controllers\Api\General\StaticPage\StaticPageController`
- **Response Resource**: `ApiResponse`

---

## 3. Website & Student Portal APIs (28 Endpoints)

### 3.1 Student Module: `Announcements` (1 endpoints)

#### `GET|HEAD` `/api/website/announcements`

- **Action**: `App\Http\Controllers\Api\Website\AnnouncementController@index`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource (`AnnouncementResource`)**:

```json
{
  "id": "id",
  "title": "title",
  "details": "details",
  "image": "string (media url) | null",
  "link": "link"
}
```

### 3.2 Student Module: `Auth` (2 endpoints)

#### `POST` `/api/website/auth/login`

- **Action**: `App\Http\Controllers\Api\Website\Student\Auth\AuthController@login`
- **Validation Class**: `LoginRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `login` | `required    |
| `phone_code`|`nullable |
  | `password` | `required |
- **Response Resource**: `ProfileResource`

#### `POST` `/api/website/auth/logout`

- **Action**: `App\Http\Controllers\Api\Website\Student\Auth\AuthController@logout`
- **Request Body / Query**: None (Empty / Path Param Only)

### 3.3 Student Module: `Courses` (2 endpoints)

#### `GET|HEAD` `/api/website/courses`

- **Action**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@available`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `AvailableCourseResource`

#### `GET|HEAD` `/api/website/courses/{course}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@showAvailable`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `CourseDetailsResource`

### 3.4 Student Module: `My-courses` (11 endpoints)

#### `GET|HEAD` `/api/website/my-courses`

- **Action**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@index`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `CourseResource`

#### `GET|HEAD` `/api/website/my-courses/{course}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@show`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `CourseDetailsResource`

#### `GET|HEAD` `/api/website/my-courses/{course}/content`

- **Action**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@content`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `CourseContentResource`

#### `GET|HEAD` `/api/website/my-courses/{course}/exams/{exam}/attempts`

- **Action**: `App\Http\Controllers\Api\Website\Student\Exam\ExamAttemptController@index`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource**: `ExamAttemptResource`

#### `POST` `/api/website/my-courses/{course}/exams/{exam}/attempts`

- **Action**: `App\Http\Controllers\Api\Website\Student\Exam\ExamAttemptController@store`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource**: `ExamAttemptResource`

#### `GET|HEAD` `/api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Exam\ExamAttemptController@show`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource**: `ExamAttemptResource`

#### `POST` `/api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}/submit`

- **Action**: `App\Http\Controllers\Api\Website\Student\Exam\ExamAttemptController@submit`
- **Validation Class**: `SubmitExamAttemptRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------------ | :----------- |
  | `answers` | `required    |
| `answers._.question_id`|`required |
  | `answers._.answer`     |`present |
- **Response Resource**: `ExamAttemptResource`

#### `GET|HEAD` `/api/website/my-courses/{course}/lessons/{lesson}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Lesson\LessonController@show`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource**: `LessonResource`

#### `POST` `/api/website/my-courses/{course}/lessons/{lesson}/completion`

- **Action**: `App\Http\Controllers\Api\Website\Student\Lesson\LessonController@complete`
- **Request Body / Query**: None (Empty / Path Param Only)

#### `DELETE` `/api/website/my-courses/{course}/lessons/{lesson}/completion`

- **Action**: `App\Http\Controllers\Api\Website\Student\Lesson\LessonController@incomplete`
- **Request Body / Query**: None (Empty / Path Param Only)

#### `GET|HEAD` `/api/website/my-courses/{course}/lessons/{lesson}/media/{media}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Media\MediaController@show`
- **Request Body / Query**: None (Empty / Path Param Only)

### 3.5 Student Module: `Orders` (5 endpoints)

#### `GET|HEAD` `/api/website/orders`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@index`
- **Validation Class**: `IndexOrderRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `status` | `nullable |
- **Response Resource (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/website/orders`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@store`
- **Validation Class**: `StoreOrderRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------- | :----------- |
  | `course_ids` | `required    |
| `course_ids._`    |`required |
  | `delivery_modes` | `sometimes   |
| `delivery_modes._`|`required |
- **Response Resource (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `GET|HEAD` `/api/website/orders/{order}`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@show`
- **Validation Class**: `IndexOrderRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `status` | `nullable |
- **Response Resource (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/website/orders/{order}/pay-with-wallet`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@payWithWallet`
- **Validation Class**: `PayOrderWithWalletRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------ | :----------- |
  | `idempotency_key` | `required |
- **Response Resource (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/website/orders/{order}/payments`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@submitManualPayment`
- **Validation Class**: `SubmitManualPaymentRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------------ | :----------- |
  | `payment_account_id` | `required    |
| `amount`               |`required |
  | `proof` | `required    |
| `submitted_phone`      |`nullable |
  | `transaction_reference` | `nullable    |
| `idempotency_key`      |`required |
- **Response Resource (`PaymentResource`)**:

```json
{
  "id": "student",
  "payment_number": "payment_number",
  "order_id": "order_id",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "order": "object (conditionally loaded)",
  "method": "enum string",
  "status": "enum string",
  "amount": "amount",
  "currency_code": "currency_code",
  "payment_account_id": "provider_payment_account_id",
  "destination_account": "destination_account_snapshot",
  "submitted_phone": "submitted_phone",
  "transaction_reference": "transaction_reference",
  "proof": "$request->user()?->isStudent() !== true && $proof !== null ? [",
  "url": "id",
  "file_name": "$proof->file_name",
  "mime_type": "$proof->mime_type",
  "proof_endpoint": "$request->user()?->isStudent() !== true && $proof !== null",
  "reviewer": "object (conditionally loaded)",
  "reviewed_at": "string (ISO/Y-m-d H:i:s)",
  "rejection_reason": "rejection_reason",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

### 3.6 Student Module: `Payment-accounts` (1 endpoints)

#### `GET|HEAD` `/api/website/payment-accounts`

- **Action**: `App\Http\Controllers\Api\Website\Student\Order\OrderController@paymentAccounts`
- **Validation Class**: `IndexOrderRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `status` | `nullable |
- **Response Resource (`ProviderPaymentAccountResource`)**:

```json
{
  "id": "id",
  "provider_id": "provider_id",
  "type": "enum string",
  "account_name": "localized string / map { ar, en }",
  "account_number": "account_number",
  "instructions": "localized string / map { ar, en }",
  "is_active": "is_active",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

### 3.7 Student Module: `Profile` (4 endpoints)

#### `GET|HEAD` `/api/website/profile`

- **Action**: `App\Http\Controllers\Api\Website\Student\Profile\ProfileController@show`
- **Request Body / Query**: None (Empty / Path Param Only)
- **Response Resource**: `ProfileResource`

#### `PUT` `/api/website/profile`

- **Action**: `App\Http\Controllers\Api\Website\Student\Profile\ProfileController@update`
- **Validation Class**: `UpdateProfileRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `first_name` | `required    |
| `father_name`         |`nullable |
  | `family_name` | `required    |
| `additional_name`     |`nullable |
  | `phone_code` | `required    |
| `phone`               |`required |
  | `guardian_phone_code` | `required    |
| `guardian_phone`      |`required |
  | `email` | ``          |
| `gender`               | `required    |
| `country_id`           |`` |
  | `governorate_id` | ``          |
| `educational_stage_id` |`` |
  | `avatar` | ``          |
|`remove_avatar`       |`nullable |
- **Response Resource**: `ProfileResource`

#### `GET|HEAD` `/api/website/profile/options`

- **Action**: `App\Http\Controllers\Api\Website\Student\Profile\ProfileController@options`
- **Validation Class**: `OptionsRequest`
- | **Request Parameters / Validation Rules**: | Field | Type & Rules |
  | :----------------------------------------- | :---- | ------------ |
  | `country_id`                               | ``    |

#### `PATCH` `/api/website/profile/password`

- **Action**: `App\Http\Controllers\Api\Website\Student\Profile\ProfileController@updatePassword`
- **Validation Class**: `UpdatePasswordRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------- | :----------- |
  | `current_password` | `required    |
| `password` | `` |
- **Response Resource**: `ProfileResource`

### 3.8 Student Module: `Wallet` (2 endpoints)

#### `GET|HEAD` `/api/website/wallet`

- **Action**: `App\Http\Controllers\Api\Website\Student\Wallet\WalletController@show`
- **Validation Class**: `IndexWalletTransactionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------ | :----------- |
  | `direction` | `nullable |
- **Response Resource (`WalletResource`)**:

```json
{
  "id": "string (ISO/Y-m-d H:i:s)"
}
```

#### `GET|HEAD` `/api/website/wallet/transactions`

- **Action**: `App\Http\Controllers\Api\Website\Student\Wallet\WalletController@transactions`
- **Validation Class**: `IndexWalletTransactionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------ | :----------- |
  | `direction` | `nullable |
- **Response Resource (`WalletTransactionResource`)**:

```json
{
  "id": "id",
  "wallet_id": "wallet_id",
  "order_id": "order_id",
  "order_number": "order",
  "direction": "enum string",
  "reason": "enum string",
  "funding_source": "funding_source",
  "amount": "amount",
  "balance_before": "balance_before",
  "balance_after": "balance_after",
  "performed_by": "object (conditionally loaded)",
  "notes": "notes",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

---

## 4. Provider Dashboard APIs (151 Endpoints across 14 Modules)

### 4.1 Provider Module: `Activation-code-groups` (7 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/activation-code-groups`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeGroupController@index`
- **Validation Class**: `IndexActivationCodeGroupRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------ | :----------- |
  | `search` | `nullable    |
| `course_id`|`nullable |
  | `sort` | ``          |
|`per_page` |`nullable |
- **Response Resource**: `ActivationCodeGroupResource`

#### `POST` `/api/dashboard/provider/activation-code-groups`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeGroupController@store`
- **Validation Class**: `StoreActivationCodeGroupRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `course_id` | `required    |
| `price`     |`required |
  | `quantity` | `required    |
| `prefix`    | ``           |
|`expires_at`|`required |
- **Response Resource**: `ActivationCodeGroupResource`

#### `GET|HEAD` `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeGroupController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ActivationCodeGroupResource`

#### `GET|HEAD` `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@index`
- **Validation Class**: `IndexActivationCodeRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------- | :----------- |
  | `search` | `nullable    |
| `status`  |`nullable |
  | `sort` | ``          |
|`per_page`|`nullable |
- **Response Resource**: `ActivationCodeResource`

#### `POST` `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@store`
- **Validation Class**: `StoreActivationCodeRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `code` | ``          |
|`price`     |`required |
  | `expires_at` | `required |
- **Response Resource**: `ActivationCodeResource`

#### `POST` `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes/bulk`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@bulkStore`
- **Validation Class**: `BulkStoreActivationCodeRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `quantity` | `required    |
| `price`     |`required |
  | `expires_at` | `required |
- **Response Resource**: `ActivationCodeGroupResource`

#### `POST` `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/generate-code`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@generate`
- **Request Parameters**: None (Path parameter or empty body)

### 4.2 Provider Module: `Activation-codes` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/activation-codes/{activationCode}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ActivationCodeResource`

#### `PUT` `/api/dashboard/provider/activation-codes/{activationCode}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@update`
- **Validation Class**: `UpdateActivationCodeRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `code` | ``          |
|`price`     |`required |
  | `status` | `required    |
| `expires_at`|`required |
- **Response Resource**: `ActivationCodeResource`

#### `DELETE` `/api/dashboard/provider/activation-codes/{activationCode}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `POST` `/api/dashboard/provider/activation-codes/{activationCode}/mark-sold`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@markSold`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ActivationCodeResource`

#### `POST` `/api/dashboard/provider/activation-codes/{activationCode}/mark-used`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ActivationCode\ActivationCodeController@markUsed`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ActivationCodeResource`

### 4.3 Provider Module: `Admins` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/admins`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Admin\AdminController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `AdminResource`

#### `POST` `/api/dashboard/provider/admins`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Admin\AdminController@store`
- **Validation Class**: `StoreAdminRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `full_name` | `required    |
| `national_id`  |`nullable |
  | `email` | `required    |
| `phone_code`   |`nullable |
  | `phone` | `nullable    |
| `password`     |`required |
  | `is_active` | `required    |
| `role_ids`     |`nullable |
  | `role_ids.*` | ``          |
|`permissions`  |`nullable |
  | `permissions.*` | `required |
- **Response Resource**: `AdminResource`

#### `GET|HEAD` `/api/dashboard/provider/admins/{admin}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Admin\AdminController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `AdminResource`

#### `PUT` `/api/dashboard/provider/admins/{admin}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Admin\AdminController@update`
- **Validation Class**: `UpdateAdminRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `full_name` | `required    |
| `national_id`  | ``           |
|`email`        | ``           |
|`phone_code`   |`nullable |
  | `phone` | `nullable    |
| `password`     |`sometimes |
  | `is_active` | `required    |
| `role_ids`     |`nullable |
  | `role_ids.*` | ``          |
|`permissions`  |`nullable |
  | `permissions.*` | `required |
- **Response Resource**: `AdminResource`

#### `DELETE` `/api/dashboard/provider/admins/{admin}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Admin\AdminController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.4 Provider Module: `Announcements` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/announcements`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Announcement\AnnouncementController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`AnnouncementResource`)**:

```json
{
  "id": "id",
  "title": "title",
  "details": "details",
  "image": "string (media url) | null",
  "link": "link"
}
```

#### `POST` `/api/dashboard/provider/announcements`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Announcement\AnnouncementController@store`
- **Validation Class**: `StoreAnnouncementRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `title` | `required    |
| `title.ar`  |`required |
  | `title.en` | `required    |
| `details`   |`required |
  | `details.ar` | `required    |
| `details.en`|`required |
  | `link` | `nullable    |
| `is_active` |`required |
  | `image` | `nullable    |
| `image_url` |`nullable |
- **Response Resource Schema (`AnnouncementResource`)**:

```json
{
  "id": "id",
  "title": "title",
  "details": "details",
  "image": "string (media url) | null",
  "link": "link"
}
```

#### `GET|HEAD` `/api/dashboard/provider/announcements/{announcement}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Announcement\AnnouncementController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`AnnouncementResource`)**:

```json
{
  "id": "id",
  "title": "title",
  "details": "details",
  "image": "string (media url) | null",
  "link": "link"
}
```

#### `PUT` `/api/dashboard/provider/announcements/{announcement}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Announcement\AnnouncementController@update`
- **Validation Class**: `UpdateAnnouncementRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`AnnouncementResource`)**:

```json
{
  "id": "id",
  "title": "title",
  "details": "details",
  "image": "string (media url) | null",
  "link": "link"
}
```

#### `DELETE` `/api/dashboard/provider/announcements/{announcement}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Announcement\AnnouncementController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.5 Provider Module: `Auth` (2 endpoints)

#### `POST` `/api/dashboard/provider/auth/login`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Auth\AuthController@login`
- **Validation Class**: `LoginRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------- | :----------- |
  | `email` | `required    |
| `password`|`required |
- **Response Resource**: `AdminResource`

#### `POST` `/api/dashboard/provider/auth/logout`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Auth\AuthController@logout`
- **Request Parameters**: None (Path parameter or empty body)

### 4.6 Provider Module: `Courses` (15 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/courses`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@index`
- **Validation Class**: `IndexCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `status`              |`nullable |
  | `educational_stage_id` | `nullable    |
| `subject_id`          |`nullable |
  | `instructor_id` | `nullable    |
| `subscription_period` |`nullable |
  | `delivery_mode` | `nullable    |
| `is_free`             |`nullable |
  | `is_active` | `nullable    |
| `has_discount`        |`nullable |
  | `sort` | ``          |
|`per_page`            |`nullable |
- **Response Resource**: `CourseResource`

#### `POST` `/api/dashboard/provider/courses`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@store`
- **Validation Class**: `StoreCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------------------------------------------------------------- |
  | `title` | `required                                                          |
| `description`         |`nullable |
  | `intro_video_url` | `nullable                                                          |
| `cover_image`         |`nullable |
  | `educational_stage_id` | ``                                                                |
| `subject_id`           |`` |
  | `instructor_id` | `$providerInstructorService->requiresInstructorSelection($user)` |
  | `subscription_period` | `required                                                          |
| `is_free`             |`required |
  | `base_price` | `required                                                          |
| `currency_code`       | ``                                                                 |
|`has_discount`        |`required |
  | `discount_percentage` | ``                                                                |
| `discount_starts_at`   | `nullable                                                          |
| `discount_ends_at`     |`` |
  | `has_limited_access` | `required                                                          |
| `access_duration_days`| ``                                                                 |
|`uses_student_groups` |`required |
  | `delivery_mode` | `required                                                          |
| `status`              |`nullable |
  | `scheduled_publish_at` | ``                                                                |
|`published_at`        |`prohibited`                                                    |
|`is_active`           |`required |
- **Response Resource**: `CourseResource`

#### `GET|HEAD` `/api/dashboard/provider/courses/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@options`
- **Validation Class**: `CourseOptionsRequest`
- | **Request Parameters / Validation Rules**: | Field | Type & Rules |
  | :----------------------------------------- | :---- | ------------ |
  | `educational_stage_id`                     | ``    |

#### `GET|HEAD` `/api/dashboard/provider/courses/{course}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `CourseResource`

#### `PUT` `/api/dashboard/provider/courses/{course}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@update`
- **Validation Class**: `UpdateCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------------------------------------------------------------- |
  | `title` | `required                                                          |
| `description`         |`nullable |
  | `intro_video_url` | `nullable                                                          |
| `cover_image`         | ``                                                                 |
|`remove_cover_image`  |`nullable |
  | `educational_stage_id` | ``                                                                |
| `subject_id`           |`` |
  | `instructor_id` | `$providerInstructorService->requiresInstructorSelection($user)` |
  | `subscription_period` | `required                                                          |
| `is_free`             |`required |
  | `base_price` | `required                                                          |
| `currency_code`       | ``                                                                 |
|`has_discount`        |`required |
  | `discount_percentage` | ``                                                                |
| `discount_starts_at`   | `nullable                                                          |
| `discount_ends_at`     |`` |
  | `has_limited_access` | `required                                                          |
| `access_duration_days`| ``                                                                 |
|`uses_student_groups` |`required |
  | `delivery_mode` | `required                                                          |
| `status`              |`nullable |
  | `scheduled_publish_at` | ``                                                                |
|`published_at`        |`prohibited`                                                    |
|`is_active`           |`required |
- **Response Resource**: `CourseResource`

#### `DELETE` `/api/dashboard/provider/courses/{course}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/courses/{course}/content`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@content`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `CourseResource`

#### `PATCH` `/api/dashboard/provider/courses/{course}/publish`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@publish`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `CourseResource`

#### `PATCH` `/api/dashboard/provider/courses/{course}/schedule`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseController@schedule`
- **Validation Class**: `ScheduleCourseRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `scheduled_publish_at` | `required |
- **Response Resource**: `CourseResource`

#### `GET|HEAD` `/api/dashboard/provider/courses/{course}/sections`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `CourseSectionResource`

#### `POST` `/api/dashboard/provider/courses/{course}/sections`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@store`
- **Validation Class**: `StoreCourseSectionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------------------------- | :------------- |
  | `title` | `required      |
| `exam_id`                                  | ``             |
|`requires_exam_pass_to_unlock_next_section`| ``             |
|`status`                                   |`sometimes |
  | `scheduled_publish_at` | ``            |
|`published_at`                             |`prohibited` |
- **Response Resource**: `CourseSectionResource`

#### `PATCH` `/api/dashboard/provider/courses/{course}/sections/reorder`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@reorder`
- **Validation Class**: `ReorderCourseSectionsRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `section_ids` | `required    |
| `section_ids.\*`|`required |
- **Response Resource**: `CourseSectionResource`

#### `GET|HEAD` `/api/dashboard/provider/courses/{course}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `CourseSectionResource`

#### `PUT` `/api/dashboard/provider/courses/{course}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@update`
- **Validation Class**: `UpdateCourseSectionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------------------------- | :------------- |
  | `title` | `required      |
| `exam_id`                                  | ``             |
|`requires_exam_pass_to_unlock_next_section`| ``             |
|`status`                                   |`sometimes |
  | `scheduled_publish_at` | ``            |
|`published_at`                             |`prohibited` |
- **Response Resource**: `CourseSectionResource`

#### `DELETE` `/api/dashboard/provider/courses/{course}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Course\CourseSectionController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.7 Provider Module: `Dashboard` (1 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/dashboard/statistics`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Dashboard\DashboardController@statistics`
- **Validation Class**: `IndexDashboardRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `PaymentRequestResource`

### 4.8 Provider Module: `Educational-stages` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/educational-stages`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\EducationalStage\EducationalStageController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `EducationalStageResource`

#### `POST` `/api/dashboard/provider/educational-stages`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\EducationalStage\EducationalStageController@store`
- **Validation Class**: `StoreEducationalStageRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `name` | `required    |
| `desc`         |`nullable |
  | `academic_year` | ``          |
|`is_active`    |`nullable |
  | `image` | `nullable |
- **Response Resource**: `EducationalStageResource`

#### `GET|HEAD` `/api/dashboard/provider/educational-stages/{educationalStage}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\EducationalStage\EducationalStageController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `EducationalStageResource`

#### `PUT` `/api/dashboard/provider/educational-stages/{educationalStage}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\EducationalStage\EducationalStageController@update`
- **Validation Class**: `UpdateEducationalStageRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `name` | `required    |
| `desc`         |`nullable |
  | `academic_year` | ``          |
|`is_active`    |`nullable |
  | `image` | `nullable    |
| `remove_image` |`nullable |
- **Response Resource**: `EducationalStageResource`

#### `DELETE` `/api/dashboard/provider/educational-stages/{educationalStage}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\EducationalStage\EducationalStageController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.9 Provider Module: `Exam-attempts` (3 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/exam-attempts`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamAttempt\ExamAttemptController@index`
- **Validation Class**: `IndexExamAttemptRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `status` | `nullable    |
| `exam_id`   |`nullable |
  | `student_id` | `nullable    |
| `per_page`  |`nullable |
- **Response Resource**: `ExamAttemptResource`

#### `GET|HEAD` `/api/dashboard/provider/exam-attempts/{attempt}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamAttempt\ExamAttemptController@show`
- **Validation Class**: `IndexExamAttemptRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------- | :----------- |
  | `status` | `nullable    |
| `exam_id`   |`nullable |
  | `student_id` | `nullable    |
| `per_page`  |`nullable |
- **Response Resource**: `ExamAttemptResource`

#### `PATCH` `/api/dashboard/provider/exam-attempts/{attempt}/grade`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamAttempt\ExamAttemptController@grade`
- **Validation Class**: `GradeExamAttemptRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------- | :----------- |
  | `answers` | `required    |
| `answers._.question_id`  |`required |
  | `answers._.awarded_score`|`required |
- **Response Resource**: `ExamAttemptResource`

### 4.10 Provider Module: `Exam-templates` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/exam-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@index`
- **Validation Class**: `IndexExamTemplateRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `classification`      |`nullable |
  | `educational_stage_id` | `nullable    |
| `subject_id`          |`nullable |
  | `instructor_id` | `nullable    |
| `is_active`           |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `ExamTemplateResource`

#### `POST` `/api/dashboard/provider/exam-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@store`
- **Validation Class**: `StoreExamTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamTemplateResource`

#### `GET|HEAD` `/api/dashboard/provider/exam-templates/{examTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamTemplateResource`

#### `PUT` `/api/dashboard/provider/exam-templates/{examTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@update`
- **Validation Class**: `UpdateExamTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamTemplateResource`

#### `DELETE` `/api/dashboard/provider/exam-templates/{examTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/exam-templates/{examTemplate}/prefill`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\ExamTemplate\ExamTemplateController@prefill`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamTemplateResource`

### 4.11 Provider Module: `Exams` (15 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/exams`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@index`
- **Validation Class**: `IndexExamRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :------------------------------------ |
  | `search` | `nullable                             |
| `status`              |`nullable |
  | `statuses` | `nullable                             |
| `statuses.\*`          |`Rule::enum(ExamStatusEnum::class)`|
|`classification`      |`nullable |
  | `educational_stage_id` | `nullable                             |
| `subject_id`          |`nullable |
  | `instructor_id` | `nullable                             |
| `course_id`           |`nullable |
  | `delivery_mode` | `nullable                             |
| `is_standalone`       |`nullable |
  | `is_active` | `nullable                             |
| `sort`                | ``                                    |
|`per_page`            |`nullable |
- **Response Resource**: `ExamResource`

#### `POST` `/api/dashboard/provider/exams`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@store`
- **Validation Class**: `StoreExamRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------------------------------- | :------------------------------- |
  | `exam_template_id` | ``                              |
| `title`                                 | `required                        |
| `description`                           | `nullable                        |
| `educational_stage_id`                  |`` |
  | `subject_id` | ``                              |
| `instructor_id`                         | `$requiresInstructorSelection` |
| `course_id`                             |`` |
  | `course_section_id` | ``                              |
| `lesson_id`                             |`` |
  | `classification` | `required                        |
| `duration_minutes`                     |`required |
  | `ends_at` | `nullable                        |
| `passing_percentage`                   |`required |
  | `max_attempts` | `required                        |
| `questions_limit`                      |`nullable |
  | `show_correct_answers_after_submission` | `required                        |
| `shuffle_questions`                    |`required |
  | `shuffle_answer_options` | `required                        |
| `delivery_mode`                        |`required |
  | `status` | `prohibited` |
  | `scheduled_publish_at` | `prohibited` |
  | `published_at` | `prohibited` |
  | `is_active` | `required |
- **Response Resource**: `ExamResource`

#### `GET|HEAD` `/api/dashboard/provider/exams/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@options`
- **Validation Class**: `ExamOptionsRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `educational_stage_id`                     | `nullable |

#### `GET|HEAD` `/api/dashboard/provider/exams/{exam}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamResource`

#### `PUT` `/api/dashboard/provider/exams/{exam}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@update`
- **Validation Class**: `UpdateExamRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------------------------------- | :------------------------------- |
  | `exam_template_id` | `prohibited` |
  | `title` | `required                        |
| `description`                          |`nullable |
  | `educational_stage_id` | ``                              |
| `subject_id`                            |`` |
  | `instructor_id` | `$requiresInstructorSelection` |
  | `course_id` | ``                              |
| `course_section_id`                     |`` |
  | `lesson_id` | ``                              |
|`classification`                       |`required |
  | `duration_minutes` | `required                        |
| `ends_at`                              |`nullable |
  | `passing_percentage` | `required                        |
| `max_attempts`                         |`required |
  | `questions_limit` | `nullable                        |
| `show_correct_answers_after_submission`|`required |
  | `shuffle_questions` | `required                        |
| `shuffle_answer_options`               |`required |
  | `delivery_mode` | `required                        |
| `status`                               |`prohibited`                  |
|`scheduled_publish_at`                 |`prohibited`                  |
|`published_at`                         |`prohibited`                  |
|`is_active`                            |`required |
- **Response Resource**: `ExamResource`

#### `DELETE` `/api/dashboard/provider/exams/{exam}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `PATCH` `/api/dashboard/provider/exams/{exam}/convert-to-course`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@convertToCourse`
- **Validation Class**: `ConvertStandaloneExamRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------- | :----------- |
  | `course_id` | ``          |
| `course_section_id` |`` |
  | `lesson_id` | `` |
- **Response Resource**: `ExamResource`

#### `PATCH` `/api/dashboard/provider/exams/{exam}/publish`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@publish`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamResource`

#### `PATCH` `/api/dashboard/provider/exams/{exam}/schedule`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamController@schedule`
- **Validation Class**: `ScheduleExamRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `scheduled_publish_at` | `` |
- **Response Resource**: `ExamResource`

#### `GET|HEAD` `/api/dashboard/provider/exams/{exam}/sections`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamSectionResource`

#### `POST` `/api/dashboard/provider/exams/{exam}/sections`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@store`
- **Validation Class**: `StoreExamSectionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------------- | :----------- |
  | `title` | `required    |
| `instructions`|`nullable |
  | `is_active` | `required |
- **Response Resource**: `ExamSectionResource`

#### `PATCH` `/api/dashboard/provider/exams/{exam}/sections/reorder`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@reorder`
- **Validation Class**: `ReorderExamSectionsRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `section_ids` | `required    |
| `section_ids.\*`|`required |
- **Response Resource**: `ExamSectionResource`

#### `GET|HEAD` `/api/dashboard/provider/exams/{exam}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `ExamSectionResource`

#### `PUT` `/api/dashboard/provider/exams/{exam}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@update`
- **Validation Class**: `UpdateExamSectionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------------- | :----------- |
  | `title` | `required    |
| `instructions`|`nullable |
  | `is_active` | `required |
- **Response Resource**: `ExamSectionResource`

#### `DELETE` `/api/dashboard/provider/exams/{exam}/sections/{section}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Exam\ExamSectionController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.12 Provider Module: `Finance` (2 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/finance/instructors`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Finance\FinanceController@instructors`
- **Validation Class**: `FinanceReportRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `year`                                     | `nullable |
  | `instructor_id`                            | `nullable |
  | `date_from`                                | `nullable |
  | `date_to`                                  | `nullable |

#### `GET|HEAD` `/api/dashboard/provider/finance/summary`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Finance\FinanceController@summary`
- **Validation Class**: `FinanceReportRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `year`                                     | `nullable |
  | `instructor_id`                            | `nullable |
  | `date_from`                                | `nullable |
  | `date_to`                                  | `nullable |

### 4.13 Provider Module: `Lesson-templates` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/lesson-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@index`
- **Validation Class**: `IndexLessonTemplateRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------ | :----------- |
  | `search` | `nullable    |
| `type`     |`nullable |
  | `is_active` | `nullable    |
| `sort`     |`nullable |
  | `per_page` | `nullable |
- **Response Resource**: `LessonTemplateResource`

#### `POST` `/api/dashboard/provider/lesson-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@store`
- **Validation Class**: `StoreLessonTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonTemplateResource`

#### `GET|HEAD` `/api/dashboard/provider/lesson-templates/{lessonTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonTemplateResource`

#### `PUT` `/api/dashboard/provider/lesson-templates/{lessonTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@update`
- **Validation Class**: `UpdateLessonTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonTemplateResource`

#### `DELETE` `/api/dashboard/provider/lesson-templates/{lessonTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/lesson-templates/{lessonTemplate}/prefill`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\LessonTemplate\LessonTemplateController@prefill`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonTemplateResource`

### 4.14 Provider Module: `Lessons` (7 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/lessons`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@index`
- **Validation Class**: `IndexLessonRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------- | :----------- |
  | `search` | `nullable    |
| `status`           |`nullable |
  | `statuses` | `nullable    |
| `statuses.\*`       |`distinct |
  | `classification` | `nullable    |
| `course_id`        |`nullable |
  | `course_section_id` | `nullable    |
| `sort`             |`nullable |
  | `per_page` | `nullable |
- **Response Resource**: `LessonResource`

#### `POST` `/api/dashboard/provider/lessons`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@store`
- **Validation Class**: `StoreLessonRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonResource`

#### `GET|HEAD` `/api/dashboard/provider/lessons/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@options`
- **Validation Class**: `LessonOptionsRequest`
- | **Request Parameters / Validation Rules**: | Field | Type & Rules |
  | :----------------------------------------- | :---- | ------------ |
  | `educational_stage_id`                     | ``    |

#### `PATCH` `/api/dashboard/provider/lessons/reorder`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@reorder`
- **Validation Class**: `ReorderLessonsRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------- | :----------- |
  | `classification` | `required    |
| `course_id`        | ``           |
|`course_section_id`| ``           |
|`lesson_ids`       |`required |
  | `lesson_ids.*` | `` |
- **Response Resource**: `LessonResource`

#### `GET|HEAD` `/api/dashboard/provider/lessons/{lesson}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonResource`

#### `PUT` `/api/dashboard/provider/lessons/{lesson}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@update`
- **Validation Class**: `UpdateLessonRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `LessonResource`

#### `DELETE` `/api/dashboard/provider/lessons/{lesson}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Lesson\LessonController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.15 Provider Module: `Media` (1 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/media/{media}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Media\MediaController@show`
- **Request Parameters**: None (Path parameter or empty body)

### 4.16 Provider Module: `Notifications` (3 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/notifications`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Notification\NotificationController@index`
- **Validation Class**: `IndexNotificationRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------- | :----------- |
  | `status` | `nullable    |
| `per_page`|`nullable |
- **Response Resource**: `NotificationResource`

#### `DELETE` `/api/dashboard/provider/notifications/{notification}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Notification\NotificationController@destroy`
- **Validation Class**: `ManageNotificationRequest`
- **Request Parameters**: None (Path parameter or empty body)

#### `PATCH` `/api/dashboard/provider/notifications/{notification}/read`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Notification\NotificationController@markAsRead`
- **Validation Class**: `ManageNotificationRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `NotificationResource`

### 4.17 Provider Module: `Orders` (2 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/orders`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Order\OrderController@index`
- **Validation Class**: `IndexOrderRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `status` | `nullable    |
| `student_id`   |`nullable |
  | `instructor_id` | `nullable    |
| `date_from`    |`nullable |
  | `date_to` | `nullable    |
| `per_page`     |`nullable |
- **Response Resource Schema (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `GET|HEAD` `/api/dashboard/provider/orders/{order}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Order\OrderController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`OrderResource`)**:

```json
{
  "id": "student",
  "order_number": "order_number",
  "invoice_number": "invoice_number",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "status": "enum string",
  "subtotal": "subtotal",
  "discount_amount": "discount_amount",
  "total_amount": "total_amount",
  "paid_amount": "paid_amount",
  "remaining_amount": "paid_amount",
  "currency_code": "currency_code",
  "items": "array of child resources",
  "payments": "array of child resources",
  "paid_at": "string (ISO/Y-m-d H:i:s)",
  "created_at": "string (ISO/Y-m-d H:i:s)",
  "updated_at": "string (ISO/Y-m-d H:i:s)"
}
```

### 4.18 Provider Module: `Payment-accounts` (4 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/payment-accounts`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PaymentAccount\PaymentAccountController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`ProviderPaymentAccountResource`)**:

```json
{
  "id": "id",
  "provider_id": "provider_id",
  "type": "enum string",
  "account_name": "localized string / map { ar, en }",
  "account_number": "account_number",
  "instructions": "localized string / map { ar, en }",
  "is_active": "is_active",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/dashboard/provider/payment-accounts`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PaymentAccount\PaymentAccountController@store`
- **Validation Class**: `StorePaymentAccountRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------- | :----------- |
  | `type` | `required    |
| `account_name`  |`required |
  | `account_number` | `required    |
| `instructions`  |`nullable |
  | `is_active` | `required |
- **Response Resource Schema (`ProviderPaymentAccountResource`)**:

```json
{
  "id": "id",
  "provider_id": "provider_id",
  "type": "enum string",
  "account_name": "localized string / map { ar, en }",
  "account_number": "account_number",
  "instructions": "localized string / map { ar, en }",
  "is_active": "is_active",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `PUT` `/api/dashboard/provider/payment-accounts/{paymentAccount}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PaymentAccount\PaymentAccountController@update`
- **Validation Class**: `UpdatePaymentAccountRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------- | :----------- |
  | `type` | `required    |
| `account_name`  |`required |
  | `account_number` | `required    |
| `instructions`  |`nullable |
  | `is_active` | `required |
- **Response Resource Schema (`ProviderPaymentAccountResource`)**:

```json
{
  "id": "id",
  "provider_id": "provider_id",
  "type": "enum string",
  "account_name": "localized string / map { ar, en }",
  "account_number": "account_number",
  "instructions": "localized string / map { ar, en }",
  "is_active": "is_active",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `DELETE` `/api/dashboard/provider/payment-accounts/{paymentAccount}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PaymentAccount\PaymentAccountController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.19 Provider Module: `Payment-requests` (1 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/payment-requests`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@requests`
- **Validation Class**: `IndexPaymentRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `status`                                   | `nullable |
  | `method`                                   | `nullable |
  | `student_id`                               | `nullable |
  | `instructor_id`                            | `nullable |
  | `search`                                   | `nullable |
  | `date_from`                                | `nullable |
  | `date_to`                                  | `nullable |
  | `sort`                                     | `nullable |
  | `per_page`                                 | `nullable |

### 4.20 Provider Module: `Payments` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/payments`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@index`
- **Validation Class**: `IndexPaymentRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `status`                                   | `nullable |
  | `method`                                   | `nullable |
  | `student_id`                               | `nullable |
  | `instructor_id`                            | `nullable |
  | `search`                                   | `nullable |
  | `date_from`                                | `nullable |
  | `date_to`                                  | `nullable |
  | `sort`                                     | `nullable |
  | `per_page`                                 | `nullable |

#### `GET|HEAD` `/api/dashboard/provider/payments/{payment}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`PaymentResource`)**:

```json
{
  "id": "student",
  "payment_number": "payment_number",
  "order_id": "order_id",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "order": "object (conditionally loaded)",
  "method": "enum string",
  "status": "enum string",
  "amount": "amount",
  "currency_code": "currency_code",
  "payment_account_id": "provider_payment_account_id",
  "destination_account": "destination_account_snapshot",
  "submitted_phone": "submitted_phone",
  "transaction_reference": "transaction_reference",
  "proof": "$request->user()?->isStudent() !== true && $proof !== null ? [",
  "url": "id",
  "file_name": "$proof->file_name",
  "mime_type": "$proof->mime_type",
  "proof_endpoint": "$request->user()?->isStudent() !== true && $proof !== null",
  "reviewer": "object (conditionally loaded)",
  "reviewed_at": "string (ISO/Y-m-d H:i:s)",
  "rejection_reason": "rejection_reason",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/dashboard/provider/payments/{payment}/approve`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@approve`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`PaymentResource`)**:

```json
{
  "id": "student",
  "payment_number": "payment_number",
  "order_id": "order_id",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "order": "object (conditionally loaded)",
  "method": "enum string",
  "status": "enum string",
  "amount": "amount",
  "currency_code": "currency_code",
  "payment_account_id": "provider_payment_account_id",
  "destination_account": "destination_account_snapshot",
  "submitted_phone": "submitted_phone",
  "transaction_reference": "transaction_reference",
  "proof": "$request->user()?->isStudent() !== true && $proof !== null ? [",
  "url": "id",
  "file_name": "$proof->file_name",
  "mime_type": "$proof->mime_type",
  "proof_endpoint": "$request->user()?->isStudent() !== true && $proof !== null",
  "reviewer": "object (conditionally loaded)",
  "reviewed_at": "string (ISO/Y-m-d H:i:s)",
  "rejection_reason": "rejection_reason",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `GET|HEAD` `/api/dashboard/provider/payments/{payment}/proof`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@proof`
- **Request Parameters**: None (Path parameter or empty body)

#### `POST` `/api/dashboard/provider/payments/{payment}/reject`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Payment\PaymentController@reject`
- **Validation Class**: `RejectPaymentRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `reason` | `required |
- **Response Resource Schema (`PaymentResource`)**:

```json
{
  "id": "student",
  "payment_number": "payment_number",
  "order_id": "order_id",
  "provider_id": "provider_id",
  "student_id": "student_id",
  "student": "object (conditionally loaded)",
  "full_name": "student",
  "phone_code": "student",
  "phone": "student",
  "email": "student",
  "order": "object (conditionally loaded)",
  "method": "enum string",
  "status": "enum string",
  "amount": "amount",
  "currency_code": "currency_code",
  "payment_account_id": "provider_payment_account_id",
  "destination_account": "destination_account_snapshot",
  "submitted_phone": "submitted_phone",
  "transaction_reference": "transaction_reference",
  "proof": "$request->user()?->isStudent() !== true && $proof !== null ? [",
  "url": "id",
  "file_name": "$proof->file_name",
  "mime_type": "$proof->mime_type",
  "proof_endpoint": "$request->user()?->isStudent() !== true && $proof !== null",
  "reviewer": "object (conditionally loaded)",
  "reviewed_at": "string (ISO/Y-m-d H:i:s)",
  "rejection_reason": "rejection_reason",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

### 4.21 Provider Module: `Platform-settings` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/platform-settings`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PlatformSetting\PlatformSettingController@show`
- **Request Parameters**: None (Path parameter or empty body)

#### `PUT` `/api/dashboard/provider/platform-settings`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PlatformSetting\PlatformSettingController@update`
- **Validation Class**: `UpdatePlatformSettingRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `support_phone_code`                       | `nullable |
  | `support_phone`                            | `nullable |
  | `whatsapp_phone_code`                      | `nullable |
  | `whatsapp_phone`                           | `nullable |
  | `facebook_url`                             | `nullable |
  | `instagram_url`                            | `nullable |
  | `tiktok_url`                               | `nullable |
  | `additional_links`                         | `nullable |
  | `additional_links.*.title`                 | ``        |
  | `additional_links.*.url`                   | `required |
  | `about`                                    | `nullable |
  | `terms`                                    | `nullable |

#### `POST` `/api/dashboard/provider/platform-settings/additional-links`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PlatformSetting\PlatformSettingController@addAdditionalLink`
- **Validation Class**: `StoreAdditionalLinkRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `title`                                    | `required |
  | `url`                                      | `required |

#### `DELETE` `/api/dashboard/provider/platform-settings/additional-links/{identifier}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PlatformSetting\PlatformSettingController@deleteAdditionalLink`
- **Request Parameters**: None (Path parameter or empty body)

#### `PATCH` `/api/dashboard/provider/platform-settings/languages`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\PlatformSetting\PlatformSettingController@updateSupportedLocales`
- **Validation Class**: `UpdateSupportedLocalesRequest`
- | **Request Parameters / Validation Rules**: | Field | Type & Rules |
  | :----------------------------------------- | :---- | ------------ |
  | `supported_locales`                        | ``    |
  | `supported_locales.*`                      | ``    |

### 4.22 Provider Module: `Profile` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/profile`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@getProfile`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `AdminResource`

#### `PUT` `/api/dashboard/provider/profile`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@update`
- **Validation Class**: `UpdateProfileRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------- | :----------- |
  | `full_name` | `required    |
| `email`      | ``           |
|`phone_code` |`nullable |
  | `phone` | `nullable    |
| `flag`       | ``           |
|`remove_flag` | `` |
- **Response Resource**: `AdminResource`

#### `PATCH` `/api/dashboard/provider/profile/dark-mode`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@updateDarkModePreference`
- **Validation Class**: `UpdateDarkModePreferenceRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------ | :----------- |
  | `allow_dark_mode` | `required |
- **Response Resource**: `AdminResource`

#### `PATCH` `/api/dashboard/provider/profile/locale`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@changeLocale`
- **Validation Class**: `ChangeLocaleRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `locale` | `required |
- **Response Resource**: `AdminResource`

#### `PATCH` `/api/dashboard/provider/profile/notification`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@updateNotificationPreference`
- **Validation Class**: `UpdateNotificationPreferenceRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------------------- | :----------- |
  | `allow_notification` | `required |
- **Response Resource**: `AdminResource`

#### `PATCH` `/api/dashboard/provider/profile/password`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Profile\ProfileController@updatePassword`
- **Validation Class**: `UpdatePasswordRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------- | :----------- |
  | `current_password` | `required    |
| `password` | `` |
- **Response Resource**: `AdminResource`

### 4.23 Provider Module: `Question-templates` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/question-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@index`
- **Validation Class**: `IndexQuestionTemplateRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `type`                |`nullable |
  | `difficulty` | `nullable    |
| `classification`      |`nullable |
  | `educational_stage_id` | `nullable    |
| `subject_id`          |`nullable |
  | `instructor_id` | `nullable    |
| `is_active`           |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `QuestionTemplateResource`

#### `POST` `/api/dashboard/provider/question-templates`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@store`
- **Validation Class**: `StoreQuestionTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionTemplateResource`

#### `GET|HEAD` `/api/dashboard/provider/question-templates/{questionTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionTemplateResource`

#### `PUT` `/api/dashboard/provider/question-templates/{questionTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@update`
- **Validation Class**: `UpdateQuestionTemplateRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionTemplateResource`

#### `DELETE` `/api/dashboard/provider/question-templates/{questionTemplate}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/question-templates/{questionTemplate}/prefill`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\QuestionTemplate\QuestionTemplateController@prefill`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionTemplateResource`

### 4.24 Provider Module: `Questions` (7 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/questions`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@index`
- **Validation Class**: `IndexQuestionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `exam_id`             |`nullable |
  | `exam_section_id` | `nullable    |
| `is_standalone`       |`nullable |
  | `type` | `nullable    |
| `difficulty`          |`nullable |
  | `classification` | `nullable    |
| `educational_stage_id`|`nullable |
  | `subject_id` | `nullable    |
| `instructor_id`       |`nullable |
  | `is_active` | `nullable    |
| `sort`                | ``           |
|`per_page`            |`nullable |
- **Response Resource**: `QuestionResource`

#### `POST` `/api/dashboard/provider/questions`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@store`
- **Validation Class**: `StoreQuestionRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionResource`

#### `GET|HEAD` `/api/dashboard/provider/questions/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@options`
- **Validation Class**: `QuestionOptionsRequest`
- | **Request Parameters / Validation Rules**: | Field     | Type & Rules |
  | :----------------------------------------- | :-------- | ------------ |
  | `educational_stage_id`                     | `nullable |
  | `exam_id`                                  | `nullable |

#### `PATCH` `/api/dashboard/provider/questions/reorder`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@reorder`
- **Validation Class**: `ReorderQuestionsRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------ | :----------- |
  | `exam_id` | ``          |
| `exam_section_id` |`` |
  | `question_ids` | `required    |
| `question_ids.\*` |`required |
- **Response Resource**: `QuestionResource`

#### `GET|HEAD` `/api/dashboard/provider/questions/{question}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionResource`

#### `PUT` `/api/dashboard/provider/questions/{question}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@update`
- **Validation Class**: `UpdateQuestionRequest`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `QuestionResource`

#### `DELETE` `/api/dashboard/provider/questions/{question}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Question\QuestionController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.25 Provider Module: `Roles` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/roles`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `RoleResource`

#### `POST` `/api/dashboard/provider/roles`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@store`
- **Validation Class**: `StoreRoleRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `name` | `required    |
| `is_active`    |`required |
  | `permissions` | `present     |
| `permissions.\*` | `` |
- **Response Resource**: `RoleResource`

#### `GET|HEAD` `/api/dashboard/provider/roles/permissions`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@permissions`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/roles/{role}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `RoleResource`

#### `PUT` `/api/dashboard/provider/roles/{role}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@update`
- **Validation Class**: `UpdateRoleRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `name` | `required    |
| `is_active`    |`required |
  | `permissions` | `present     |
| `permissions.\*` | `` |
- **Response Resource**: `RoleResource`

#### `DELETE` `/api/dashboard/provider/roles/{role}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Role\RoleController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.26 Provider Module: `Students` (10 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/students`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@index`
- **Validation Class**: `IndexStudentRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :----------------------- | :----------- |
  | `search` | `nullable    |
| `country_id`          |`nullable |
  | `governorate_id` | `nullable    |
| `educational_stage_id`|`nullable |
  | `registration_type` | ``          |
|`status`              |`nullable |
  | `sort` | `nullable    |
| `per_page`            |`nullable |
- **Response Resource**: `StudentResource`

#### `POST` `/api/dashboard/provider/students`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@store`
- **Validation Class**: `StoreStudentRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `status` | `required    |
| `avatar` | `` |
- **Response Resource**: `StudentResource`

#### `GET|HEAD` `/api/dashboard/provider/students/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@options`
- **Validation Class**: `StudentOptionsRequest`
- | **Request Parameters / Validation Rules**: | Field | Type & Rules |
  | :----------------------------------------- | :---- | ------------ |
  | `country_id`                               | ``    |

#### `GET|HEAD` `/api/dashboard/provider/students/{student}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `StudentResource`

#### `PUT` `/api/dashboard/provider/students/{student}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@update`
- **Validation Class**: `UpdateStudentRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :---------------- | :----------- |
  | `avatar` | ``          |
|`remove_avatar`|`sometimes |
- **Response Resource**: `StudentResource`

#### `DELETE` `/api/dashboard/provider/students/{student}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

#### `PATCH` `/api/dashboard/provider/students/{student}/status`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Student\StudentController@updateStatus`
- **Validation Class**: `UpdateStudentStatusRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :--------- | :----------- |
  | `status` | `required |
- **Response Resource**: `StudentResource`

#### `GET|HEAD` `/api/dashboard/provider/students/{student}/wallet`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Wallet\WalletController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource Schema (`WalletResource`)**:

```json
{
  "id": "string (ISO/Y-m-d H:i:s)"
}
```

#### `POST` `/api/dashboard/provider/students/{student}/wallet/adjustments`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Wallet\WalletController@adjust`
- **Validation Class**: `AdjustWalletRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------------ | :----------- |
  | `direction` | `required    |
| `reason`         |`required |
  | `funding_source` | ``          |
|`amount`         |`required |
  | `notes` | `nullable    |
| `idempotency_key`|`required |
- **Response Resource Schema (`WalletTransactionResource`)**:

```json
{
  "id": "id",
  "wallet_id": "wallet_id",
  "order_id": "order_id",
  "order_number": "order",
  "direction": "enum string",
  "reason": "enum string",
  "funding_source": "funding_source",
  "amount": "amount",
  "balance_before": "balance_before",
  "balance_after": "balance_after",
  "performed_by": "object (conditionally loaded)",
  "notes": "notes",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

#### `GET|HEAD` `/api/dashboard/provider/students/{student}/wallet/transactions`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Wallet\WalletController@transactions`
- **Validation Class**: `IndexWalletTransactionRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :------------ | :----------- |
  | `direction` | `nullable    |
| `reason`   |`nullable |
  | `per_page` | `nullable |
- **Response Resource Schema (`WalletTransactionResource`)**:

```json
{
  "id": "id",
  "wallet_id": "wallet_id",
  "order_id": "order_id",
  "order_number": "order",
  "direction": "enum string",
  "reason": "enum string",
  "funding_source": "funding_source",
  "amount": "amount",
  "balance_before": "balance_before",
  "balance_after": "balance_after",
  "performed_by": "object (conditionally loaded)",
  "notes": "notes",
  "created_at": "string (ISO/Y-m-d H:i:s)"
}
```

### 4.27 Provider Module: `Subjects` (5 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/subjects`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Subject\SubjectController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `SubjectResource`

#### `POST` `/api/dashboard/provider/subjects`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Subject\SubjectController@store`
- **Validation Class**: `StoreSubjectRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------- | :----------- |
  | `name` | `required    |
| `desc`                   |`nullable |
  | `educational_stage_ids` | `nullable    |
| `educational_stage_ids.\*`| ``           |
|`is_active`              |`nullable |
  | `image` | `nullable |
- **Response Resource**: `SubjectResource`

#### `GET|HEAD` `/api/dashboard/provider/subjects/{subject}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Subject\SubjectController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `SubjectResource`

#### `PUT` `/api/dashboard/provider/subjects/{subject}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Subject\SubjectController@update`
- **Validation Class**: `UpdateSubjectRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------- | :----------- |
  | `name` | `required    |
| `desc`                   |`nullable |
  | `educational_stage_ids` | `nullable    |
| `educational_stage_ids.\*`| ``           |
|`is_active`              |`nullable |
  | `image` | ``          |
|`remove_image`           |`nullable |
- **Response Resource**: `SubjectResource`

#### `DELETE` `/api/dashboard/provider/subjects/{subject}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Subject\SubjectController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

### 4.28 Provider Module: `Teachers` (6 endpoints)

#### `GET|HEAD` `/api/dashboard/provider/teachers`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@index`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `TeacherResource`

#### `POST` `/api/dashboard/provider/teachers`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@store`
- **Validation Class**: `StoreTeacherRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------- | :----------- |
  | `full_name` | `required    |
| `email`                  |`required |
  | `phone_code` | `nullable    |
| `phone`                  |`nullable |
  | `password` | `required    |
| `is_active`              |`required |
  | `avatar` | `nullable    |
| `avatar_url`             |`nullable |
  | `educational_stage_ids` | `sometimes   |
| `educational_stage_ids._`|`integer |
  | `subject_ids` | `sometimes   |
| `subject_ids._`          |`integer |
- **Response Resource**: `TeacherResource`

#### `GET|HEAD` `/api/dashboard/provider/teachers/options`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@options`
- **Request Parameters**: None (Path parameter or empty body)

#### `GET|HEAD` `/api/dashboard/provider/teachers/{teacher}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@show`
- **Request Parameters**: None (Path parameter or empty body)
- **Response Resource**: `TeacherResource`

#### `PUT` `/api/dashboard/provider/teachers/{teacher}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@update`
- **Validation Class**: `UpdateTeacherRequest`
- **Request Parameters / Validation Rules**:
  | Field | Type & Rules |
  | :-------------------------- | :----------- |
  | `full_name` | `required    |
| `email`                  | ``           |
|`phone_code`             |`nullable |
  | `phone` | `nullable    |
| `password`               |`sometimes |
  | `is_active` | `required    |
| `avatar`                 |`nullable |
  | `avatar_url` | `nullable    |
| `remove_avatar`          |`sometimes |
  | `educational_stage_ids` | `sometimes   |
| `educational_stage_ids._`|`integer |
  | `subject_ids` | `sometimes   |
| `subject_ids._`          |`integer |
- **Response Resource**: `TeacherResource`

#### `DELETE` `/api/dashboard/provider/teachers/{teacher}`

- **Action**: `App\Http\Controllers\Api\Dashboard\Provider\Teacher\TeacherController@destroy`
- **Request Parameters**: None (Path parameter or empty body)

---

## 5. Domain Enums Reference

| Enum Name                | Enum Class                         | Allowed Values                                                               |
| :----------------------- | :--------------------------------- | :--------------------------------------------------------------------------- |
| `UserTypeEnum`           | `App\Enums\UserTypeEnum`           | `super_admin`, `admin`, `center`, `teacher`, `group`, `assistant`, `student` |
| `CourseDeliveryModeEnum` | `App\Enums\CourseDeliveryModeEnum` | `online`, `center`, `hybrid`                                                 |
| `CourseStatusEnum`       | `App\Enums\CourseStatusEnum`       | `draft`, `published`, `scheduled`, `archived`                                |
| `SubscriptionPeriodEnum` | `App\Enums\SubscriptionPeriodEnum` | `monthly`, `term`, `yearly`, `lifetime`                                      |
| `OrderStatusEnum`        | `App\Enums\OrderStatusEnum`        | `pending`, `paid`, `cancelled`, `refunded`                                   |
| `PaymentStatusEnum`      | `App\Enums\PaymentStatusEnum`      | `pending`, `approved`, `rejected`                                            |
| `StudentStatusEnum`      | `App\Enums\StudentStatusEnum`      | `active`, `suspended`, `inactive`                                            |
| `PaymentAccountTypeEnum` | `App\Enums\PaymentAccountTypeEnum` | `bank_account`, `instapay`, `vodafone_cash`, `wallet`                        |
