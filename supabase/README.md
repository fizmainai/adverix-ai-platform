# Supabase Database Migrations

Bu klasör Adverix AI projesinin Supabase database migration dosyalarını içerir.

## 📁 Klasör Yapısı

```
supabase/
├── migrations/          # Database migration dosyaları
│   └── 20250127000000_initial_schema.sql
├── config.toml         # Supabase proje konfigürasyonu
└── README.md           # Bu dosya
```

## 🚀 Migration Dosyaları

Migration dosyaları timestamp ile isimlendirilir:
- Format: `YYYYMMDDHHMMSS_description.sql`
- Örnek: `20250127000000_initial_schema.sql`

## 📝 Migration Çalıştırma

### Supabase Dashboard'dan:
1. Supabase Dashboard → SQL Editor
2. Migration dosyasını aç ve içeriğini kopyala
3. SQL Editor'a yapıştır ve çalıştır

### Supabase CLI ile:
```bash
# Supabase CLI kurulumu (eğer yoksa)
npm install -g supabase

# Supabase'e login ol
supabase login

# Projeyi link et
supabase link --project-ref swfyzmthayopmtbwuncn

# Migration'ları uygula
supabase db push
```

## 🔄 Yeni Migration Oluşturma

1. Yeni migration dosyası oluştur:
```bash
supabase migration new migration_name
```

2. SQL komutlarını yaz
3. Test et
4. Commit ve push et

## 📊 Mevcut Tablolar

- `profiles` - Kullanıcı profilleri
- `subscriptions` - Abonelik bilgileri
- `plan_limits` - Plan limitleri
- `agent_configurations` - AI agent ayarları
- `whatsapp_connections` - WhatsApp bağlantıları
- `calendar_connections` - Cal.com bağlantıları
- `conversations` - Konuşmalar
- `messages` - Mesajlar
- `calls` - Çağrılar
- `appointments` - Randevular
- `knowledge_embeddings` - Vector DB embeddings
- `conversation_summaries` - Konuşma özetleri
- `error_logs` - Hata logları
- `handoff_queue` - İnsan müdahalesi kuyruğu
- `onboarding_progress` - Onboarding ilerlemesi
- `email_templates` - Email şablonları

## 🔐 Güvenlik

- Migration dosyaları public repository'de olabilir
- Ama **ASLA** API key'leri, secret'ları commit etme
- `.env` dosyasını `.gitignore`'a ekle

## 📚 Daha Fazla Bilgi

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)

