# NexTap — Project Specification

## 1. فكرة المشروع

**NexTap** عبارة عن منصة Digital Business Card / Mini Business Landing Page مرتبطة بكروت فعلية تحتوي على:

- NFC
- QR Code
- Unique Card ID

الدومين الرئيسي:

`nextap.services`

كل كارت يتم طباعته مسبقًا ويكون له **معرّف دائم وفريد**، ويظل نفس الكارت صالحًا حتى لو تغير اسم النشاط أو بياناته أو تصميم صفحته لاحقًا.

---

# 2. الهدف من المنتج

العميل يشتري كارت NexTap.

بعد تفعيل الكارت وربطه بالبزنس الخاص به، أي شخص:

- يعمل Tap بالـNFC
- أو Scan للـQR

يفتح له مباشرة Landing Page صغيرة خاصة بالنشاط التجاري.

الصفحة تعمل كخليط بين:

**Digital Business Card + Link in Bio + Mini Website**

ولا تحتاج أن تكون Website كاملة.

---

# 3. رحلة الكارت

## قبل البيع

كل الكروت موجودة في قاعدة البيانات بالحالة:

`Inactive`

في البداية الـIDs الموجودة حاليًا في Excel يمكن Import لها إلى النظام.

مثال:

| Card ID | Status | Business |
|---|---|---|
| X7K92P | Inactive | — |
| M8A21Z | Inactive | — |
| Q3N71L | Active | Alfa Cafe |

---

## عند البيع

يقوم Admin بفتح Dashboard ويختار الكارت.

ثم:

`Inactive → Assign Business → Activate`

بعدها يصبح الكارت مربوطًا ببزنس معين.

مثال:

`Card X7K92P → Alfa Cafe`

---

## بعد التفعيل

الـQR والـNFC يشيران دائمًا إلى URL ثابت مثل:

`https://nextap.services/c/X7K92P`

عند فتحه:

`Card ID`
↓
`Check card`
↓
`Check status`
↓
`Identify business`
↓
`Load / Redirect to business profile`

---

every card is assigned to only one businees but a business can have multiple cards assigned to it 

# 4. أهم قاعدة في النظام

الـQR والـNFC **لا يتم ربطهما مباشرة بصفحة العميل النهائية**.

هما مربوطان دائمًا بـCard ID ثابت.

مثال:

`nextap.services/c/X7K92P`

وليس:

`nextap.services/alfa-cafe`

السبب أن الكارت المطبوع يجب ألا يتغير أبدًا.

لو العميل:

- غير اسم البزنس
- غير الـslug
- غير التصميم
- غير الروابط
- نقل ملكية الكارت لاحقًا

لن نحتاج إلى إعادة طباعة QR أو إعادة برمجة NFC.

---

# 5. Card ID

يجب ألا يكون ID متسلسلًا مثل:

`1`
`2`
`3`
`4`

الأفضل استخدام Random Public Token مثل:

`X7K92P4D`

أو:

`NT-A83KM92`

بحيث يكون:

- Unique
- صعب التخمين
- ثابت للأبد
- صالح للطباعة على QR
- صالح للكتابة على NFC

ويمكن أن يكون هناك Internal Database ID مختلف لا يظهر للمستخدم.

---

# 6. Multi-Tenant Architecture

النظام كله Application واحدة.

لن يكون لكل Business موقع أو Installation منفصل.

مثال:

`NexTap Platform`

تحتها:

`Business A`
`Business B`
`Business C`
`Business D`

كل Business يعتبر Tenant داخل النظام.

كل البيانات ترتبط بـ:

`business_id`

وبالتالي يمكن تشغيل:

200 Business

ثم:

1,000

ثم:

5,000

ثم عشرات الآلاف

بدون إنشاء موقع منفصل لكل عميل.

---

# 7. Public Business Landing Page

الصفحة العامة ستكون بسيطة جدًا وسريعة.

معظم محتواها Static.

مثال:

### Header / Hero

- صورة / Logo
- Business Name
- Short Description

### Contact

- WhatsApp
- Phone
- Email

### Social Media

مثل:

- Instagram
- Facebook
- TikTok
- YouTube
- Snapchat
- LinkedIn
- X

### Payments

مثل:

- InstaPay
- Vodafone Cash
- Payment Link
- Custom Payment URL

NexTap في المرحلة الحالية **لا يعالج الدفع بنفسه**.

هو فقط يعرض Button يعمل Redirect إلى وسيلة الدفع الخاصة بالبزنس.

### Location

- Google Maps
- Address
- Directions

### Business Hours

مثال:

`Saturday: 10 AM – 10 PM`

### Reviews

يمكن توفير:

- Google Reviews button
- Google Rating
- Stars

أما سحب Google Rating تلقائيًا فيفضل التعامل معه كـIntegration منفصل باستخدام الطريقة الرسمية لاحقًا.

### Custom Links

مثل:

- Menu
- Order Online
- Book Now
- Website
- Price List
- Portfolio
- Reservation
- أي URL آخر

---

# 8. الصور

في النسخة الحالية كل Business يحتاج فقط:

**صورتين**

مثلاً:

1. Logo / Profile image
2. Cover / Business image

وبالتالي استهلاك الـStorage سيكون قليلًا جدًا.

مثال حتى لو كل صورة 1MB:

`5,000 businesses × 2MB = حوالي 10GB`

وهو حجم بسيط نسبيًا.

---

# 9. Dynamic Sections

صفحة البزنس لن تكون Template إجبارية.

كل Business يستطيع تحديد الأقسام التي يريد إظهارها.

مثلاً مطعم قد يحتاج:

- Location
- Menu
- WhatsApp
- Instagram
- Opening Hours
- Reviews

بينما Freelancer قد يحتاج:

- Portfolio
- Instagram
- WhatsApp
- LinkedIn

وبالتالي كل Section يحتوي على:

`enabled`

و:

`sort_order`

مثال:

```text
Hero             ON
Social Media     ON
Payments         OFF
Opening Hours    ON
Google Reviews   ON
Location         OFF
```

---

# 10. Dynamic Links

لا يتم تصميم Database بحيث يكون لدينا Column لكل منصة.

أي لا نعمل:

```text
instagram_url
facebook_url
tiktok_url
youtube_url
```

لأن ذلك سيصبح محدودًا مع الوقت.

بدل ذلك يتم إنشاء جدول عام للروابط.

مثال:

```text
business_links

id
business_id
type
label
url
icon
is_active
sort_order
```

مثال بيانات:

```text
101
business_32
instagram
Instagram
https://instagram.com/...
true
1
```

ثم:

```text
102
business_32
whatsapp
WhatsApp
https://wa.me/...
true
2
```

ثم:

```text
103
business_32
custom
View Menu
https://...
true
3
```

وبالتالي Business يستطيع امتلاك:

2 Links

أو:

5 Links

أو:

15 Links

بدون أي تعديل في Database Structure.

---

# 11. Sections Database

جدول منفصل للأقسام:

```text
business_sections

id
business_id
section_type
is_enabled
sort_order
settings
```

`settings` يمكن أن تكون JSON حسب نوع الـSection.

مثال Payment Section:

```json
{
  "title": "طرق الدفع",
  "layout": "buttons"
}
```

مثال Social Section:

```json
{
  "title": "تابعنا",
  "style": "icons"
}
```

---

# 12. Rendering System

صفحة البزنس تعمل بالشكل التالي:

```text
Load Business
      ↓
Load Enabled Sections
      ↓
Order By sort_order
      ↓
Load Links/Data
      ↓
Render Components
```

مثلاً:

```text
HeroComponent

SocialLinksComponent

OpeningHoursComponent

PaymentComponent

MapsComponent

ReviewsComponent

CustomLinksComponent
```

وبالتالي إضافة Feature جديدة مستقبلًا لا تحتاج إعادة بناء الصفحة.

مثلاً إضافة:

`Booking Section`

تعني إنشاء:

`BookingComponent`

وإضافة:

`section_type = booking`

---

# 13. Business Dashboard

كل صاحب Business سيكون عنده Dashboard بسيطة.

يستطيع منها تعديل:

### Business Information

- Business Name
- Description
- Phone
- WhatsApp
- Address

### Images

- Profile / Logo
- Cover / Main image

### Links

- Add Link
- Edit Link
- Delete Link
- Enable / Disable Link

### Sections

- Enable Section
- Disable Section

ويمكن لاحقًا إضافة:

`Drag & Drop`

لإعادة ترتيب Sections والـLinks.

لكنها ليست ضرورية لأول Version.

يمكن في البداية استخدام:

`Move Up / Move Down`

أو ترتيب رقمي بسيط لتقليل تعقيد الـMVP.

---

# 14. Admin Dashboard

Admin NexTap يحتاج Dashboard لإدارة المنصة بالكامل.

تشمل:

### Cards

عرض:

- Card ID
- Status
- Assigned Business
- Activation Date

Actions:

- Activate
- Deactivate
- Assign
- Unassign
- Search


### Businesses

عرض:

- Business Name
- Owner
- Card
- Status
- Created Date

Actions:

- Create
- Edit
- Disable
- View Page

### Users

إدارة حسابات أصحاب البزنس.

---

# 15. User Roles

في البداية نحتاج Role one

## NexTap Admin

يستطيع:

- إضافة Cards
- Import Cards
- Activate Cards
- إنشاء Businesses
- ربط Card بـBusiness
- إدارة النظام بالكامل


we can also manage the businesses 
مثل:

- تعديل البيانات
- تعديل الصور
- إضافة Links
- إخفاء Sections
- تغيير الترتيب



# 16. Authentication

يفضل استخدام:

**Supabase Auth**

بدل بناء Authentication من الصفر.

يمكن في البداية استخدام:

- Email + Password

ويمكن لاحقًا إضافة:

- OTP
- Google Login
- Magic Link

---

# 17. Database Structure

الـDatabase الأساسية:

**PostgreSQL**

من خلال Supabase.

الجداول الأساسية المقترحة:

```text
users
businesses
cards
business_sections
business_links
business_images
```

ويمكن إضافة:

```text
scan_events
```

للـAnalytics.

---

# 18. Businesses Table

مثال مبدئي:

```text
businesses

id
owner_user_id
name
slug
description
phone
whatsapp
address
status
created_at
updated_at
```

---

# 19. Cards Table

```text
cards

id
public_token
status
business_id
activated_at
created_at
```

مثال:

```text
id = 523

public_token = X7K92P4D

status = active

business_id = 82
```

---

# 20. Images Table / Storage

الصور نفسها لا تحفظ داخل PostgreSQL.

تحفظ في Object Storage مثل Supabase Storage.

والـDatabase تحتفظ فقط بالمسار.

مثلاً:

```text
business_images

id
business_id
image_type
storage_path
```

Types:

```text
logo
cover
```

---

# 21. QR / NFC Request Flow

المستخدم يعمل Scan:

```text
QR / NFC
     ↓
nextap.services/c/X7K92P
     ↓
Cloud / Application
     ↓
Find Card
     ↓
Is Active?
```

إذا:

`Inactive`

تظهر صفحة مثل:

**This NexTap card has not been activated yet.**

إذا:

`Active`

يتم تحديد:

`business_id`

ثم فتح Business Page.

---

# 22. Business URL

يمكن أن يمتلك البزنس URL اختياريًا جميلًا مثل:

`nextap.services/b/alfa-cafe`

لكن QR لا يعتمد عليه.

الـQR يعتمد دائمًا على:

`nextap.services/c/X7K92P`

---

# 23. Static / Cached Architecture

معظم الصفحة Static.

وهذا مناسب جدًا لطبيعة المشروع.

المستخدم لا يقوم بعمليات معقدة.

غالبية الأزرار مجرد:

`Click → Redirect`

مثل:

`Instagram`

`WhatsApp`

`Google Maps`

`InstaPay`

وغيرها.

لذلك لا يوجد سبب أن يقوم كل Scan بتنفيذ Queries كثيرة على Database.

---

# 24. Caching

Business Page يمكن تخزينها في Cache.

مثال:

أول Visit:

```text
User
 ↓
Application
 ↓
Database
 ↓
Generate Page
 ↓
Cache
```

الزيارات التالية:

```text
User
 ↓
CDN / Cache
 ↓
Page
```

بدون الرجوع إلى Database في كل مرة.

---

# 25. عند تعديل الصفحة

عندما يغير Business بياناته:

```text
Dashboard
 ↓
Update Database
 ↓
Invalidate / Refresh Cache
 ↓
New Page Version
```

وبالتالي التغيير يظهر بسرعة بدون التضحية بالأداء.

---

# 26. Rate Limiting

لا نحتاج Rate Limiting قوي على Public Business Page.

الهدف منها أصلًا أن يستطيع عدد كبير من الأشخاص فتحها.

Rate Limiting يكون أساسًا على:

```text
/login

/signup

/card/activate

/business/update

/upload

/admin APIs
```

لحماية النظام من Abuse وBots.

Cloudflare أو منصة الاستضافة يمكن أن تتولى جزءًا كبيرًا منه.

---

# 27. Security

نحتاج من البداية:

### Database permissions

Business A لا يستطيع قراءة أو تعديل Business B.

يتم تطبيق Tenant Isolation باستخدام:

`business_id`

وسياسات قاعدة البيانات مثل Row Level Security.

### Admin APIs

لا يستطيع Business Owner الوصول إليها.

### Upload Security

التحقق من:

- File type
- File size
- Image only

### Public IDs

استخدام Tokens غير قابلة للتخمين بدل Sequential IDs.

---

# 28. Recommended Technical Stack

الـStack المقترح حاليًا:

### Frontend / Application

**Next.js**

أو Framework React مشابه.

### Database

**Supabase PostgreSQL**

### Authentication

**Supabase Auth**

### Images

**Supabase Storage**

### CDN / DNS / Security

**Cloudflare**

### Hosting

Managed Hosting مثل:

**Vercel أو Cloudflare**

ولا نحتاج VPS في البداية.

---

# 29. High-Level Architecture

```text
                    ┌──────────────────┐
                    │ NFC / QR Card    │
                    └────────┬─────────┘
                             │
                             ▼
                  nextap.services/c/ID
                             │
                             ▼
                    ┌─────────────────┐
                    │ CDN / Cloudflare│
                    └────────┬────────┘
                             │
                         Cache Hit?
                       /             \
                    YES               NO
                    │                  │
                    ▼                  ▼
               Cached Page        Next.js App
                                      │
                                      ▼
                              Supabase Database
                                      │
                                      ▼
                               Business Data
                                      │
                                      ▼
                                  Render Page
```

---

# 30. Image Flow

```text
Business Dashboard
       ↓
Upload Image
       ↓
Supabase Storage
       ↓
CDN
       ↓
Business Landing Page
```

---

# 31. Admin Flow

```text
Admin Login
    ↓
Cards Dashboard
    ↓
Select Card
    ↓
Select/Create Business
    ↓
Assign Card
    ↓
Activate
    ↓
Card becomes live
```

---

# 32. Business Owner Flow

```text
Business Login
      ↓
Dashboard
      ↓
Edit Profile
      ↓
Add / Remove Links
      ↓
Enable / Disable Sections
      ↓
Upload Images
      ↓
Save
      ↓
Cache Refresh
      ↓
Public Page Updated
```

---

# 33. Excel Cards Import

الـExcel الموجود حاليًا يمكن تحويله بسهولة إلى Database.

مثلاً Excel يحتوي:

```text
card_id
status
```

نعمل Import إلى:

`cards`

وبعدها إدارة الـCards تتم من Admin Dashboard بدل Excel.

ويمكن الاحتفاظ بـExcel فقط كنسخة Export/Backup عند الحاجة.

---

# 34. Analytics

ليست ضرورية لعمل Core Product.

لكن يمكن إضافتها.

مثلاً:

- Total Scans
- Today Scans
- Monthly Scans
- Most clicked links

جدول مثل:

```text
scan_events

id
card_id
business_id
created_at
country
device_type
referrer
```

لكن لا يفضل بناء Analytics ضخمة من أول Version.

في البداية يمكن الاحتفاظ بـ:

`scan_count`

أو Basic Events فقط.

وعند زيادة الزيارات جدًا يمكن فصل Analytics عن الـMain Database.

---

# 35. Google Reviews

هناك مستويان.

## MVP

Button:

`See our Google Reviews`

يعمل Redirect لصفحة Google الخاصة بالبزنس.

## Advanced

إظهار:

`4.8 ★`

وعدد Reviews بشكل تلقائي.

هذا يحتاج Google integration منفصلة ويعامل كـFeature إضافية، وليس جزءًا أساسيًا من Architecture.

---

# 36. Payments

في النسخة الحالية NexTap ليس Payment Gateway.

مثلاً Button:

**Pay with InstaPay**

يعمل Redirect إلى الرابط أو البيانات التي يحددها Business.

ونفس الشيء:

- Vodafone Cash
- Payment URL
- PayPal
- Stripe Payment Link
- غيرها مستقبلًا

وبالتالي NexTap لا يحتفظ بأموال العميل ولا يعالج Transaction.

---

# 37. MVP المقترح

أول Version يركز فقط على Core Product.

يحتوي على:

### Admin

- Login
- Cards list
- Business list
- Create Business
- Activate Card
- Assign Card

### Business

- Login
- Edit Business Info
- Upload صورتين
- Add/Delete Links
- Enable/Disable Sections
- ترتيب بسيط

### Public

- NFC/QR resolver
- Business Landing Page
- Responsive Mobile Design
- Social Links
- Payment Links
- Maps
- Hours
- Custom Links

---

# 38. أشياء لا نحتاجها في أول Version

لا نحتاج حاليًا:

- Kubernetes
- Microservices
- Redis Cluster
- Dedicated Servers
- Multiple Databases
- Complex Queue System
- WordPress
- Full Website Builder
- Advanced Drag & Drop Builder
- Heavy Analytics Platform

لأن ذلك سيزيد التكلفة والتعقيد بدون فائدة في المرحلة الحالية.

---

# 39. لماذا WordPress ليس الاختيار المفضل؟

WordPress يستطيع تنفيذ المشروع، لكن المشروع ليس Content Website عاديًا.

لدينا Business Logic مثل:

```text
Card
↓
Activation
↓
Business Assignment
↓
Tenant
↓
Dynamic Sections
↓
User Permissions
↓
Cached Landing Page
```

لبناء ذلك في WordPress سنحتاج:

- Custom Post Types
- Custom Fields
- Custom Plugin
- User Roles
- Activation Logic
- Custom APIs
- Redirect Logic
- Caching Plugins

وفي النهاية سنكون قد بنينا Application داخل WordPress.

لذلك Custom Lightweight App أنسب على المدى الطويل.

---

# 40. Scalability

عدد Businesses نفسه ليس مشكلة كبيرة.

مثلاً:

`10,000 businesses`

يعني 10,000 Records تقريبًا في Businesses table، وهو رقم صغير جدًا بالنسبة لـPostgreSQL.

الأهم هو عدد الزيارات.

لكن لأن Public Pages Cached، يمكن للنظام تحمل عدد كبير من الزيارات بدون تحميل Database مع كل Scan.

---

# 41. مراحل التوسع

## 0 – 5,000 Business

نفس Architecture:

```text
Next.js
Supabase
Storage
CDN
Better caching
Database indexes
Image optimization
```

بدون تعقيد إضافي.



## 5,000 – 20,000+

ما زلنا لا نحتاج إعادة بناء النظام.

قد نضيف:

- Advanced caching
- Separate analytics
- Background jobs عند الحاجة

## Scale كبير جدًا

إذا أصبح لدينا ملايين الـScan Events شهريًا، يمكن نقل Analytics إلى System منفصل.

لكن:

`Businesses`
`Cards`
`Users`
`Links`

تظل على نفس Architecture الأساسية.

---

# 42. Estimated Complexity

المشروع بالكامل حاليًا يعتبر:

**Medium Complexity**

وليس Enterprise-level system.

الأجزاء السهلة:

- Business Landing Page
- Links
- QR Redirect
- NFC
- Images

الأجزاء المتوسطة:

- Multi-tenancy
- Dashboard
- Dynamic Sections
- Authentication
- Permissions
- Caching

Dynamic Sections ترفع المرونة بشكل كبير، لكن لا ترفع تكلفة الاستضافة تقريبًا.

الزيادة الأساسية تكون في Development فقط.

---

# 43. Core Data Relationship

أهم Relationship في النظام:

```text
User
 │
 ▼
Business
 │
 ├──────── Business Sections
 │
 ├──────── Business Links
 │
 ├──────── Business Images
 │
 └──────── Cards
```

والـCard:

```text
Card Public Token
       │
       ▼
   Business ID
       │
       ▼
Business Landing Page
```

---

# 44. Suggested Project Structure

مثال مبدئي لتنظيم التطبيق:

```text
/app

  /c
    /[cardId]

  /b
    /[slug]

  /dashboard

    /profile

    /links

    /sections

    /images

  /admin

    /cards

    /businesses

    /users

/api

  /cards

  /businesses

  /links

  /uploads

/components

  /landing

    Hero
    SocialLinks
    Payments
    OpeningHours
    Maps
    Reviews
    CustomLinks

  /dashboard

  /admin

/lib

  /supabase

  /auth

  /cache

  /permissions

/types
```

---

# 45. Final Core Architecture

النسخة التي نتجه إليها حاليًا هي:

```text
                    NEX TAP
                       │
       ┌───────────────┴────────────────┐
       │                                │
   Admin System                    Business System
       │                                │
 Card Inventory                    Business Dashboard
 Activation                       Profile Management
 Assignment                       Sections / Links
       │                                │
       └───────────────┬────────────────┘
                       │
                    Database
                       │
               Supabase/Postgres
                       │
               ┌───────┴───────┐
               │               │
             Cards         Businesses
                               │
                   ┌───────────┼───────────┐
                   │           │           │
                 Links      Sections     Images
                   │           │           │
                   └───────────┼───────────┘
                               │
                               ▼
                       Cached Landing Page
                               │
                               ▼
                        NFC / QR Visitors
```

---

# 46. الخلاصة

NexTap في صورته الحالية هو:

**Multi-Tenant Digital Business Card Platform**

يعتمد على:

**Permanent NFC/QR Card IDs**

مع:

**Dynamic Mini Landing Pages**

تحت:

`nextap.services`

كل Business يمتلك صفحة مرنة يستطيع فيها:

- إضافة وإزالة Links
- تشغيل وإيقاف Sections
- إضافة صورتين
- إضافة Social Media
- إضافة Payment Links
- إضافة WhatsApp
- إضافة Maps
- إضافة Opening Hours
- إضافة Google Reviews
- إضافة Custom Links

مع:

**Admin Dashboard لإدارة الكروت والتفعيل**

و:

**Business Dashboard لإدارة الصفحة**

والـArchitecture مصممة بحيث تبدأ ببضع مئات من Businesses وتستمر إلى آلاف كثيرة بدون الحاجة لإعادة بناء المشروع من البداية.