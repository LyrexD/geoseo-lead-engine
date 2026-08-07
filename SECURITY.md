# Güvenlik politikası

## Desteklenen sürüm

Aktif olarak yalnızca `main` branch'indeki en güncel sürüm desteklenir.

## Güvenlik açığı bildirme

Bir güvenlik sorunu bulursanız herkese açık issue açmayın. GitHub profilindeki iletişim adresi üzerinden özel olarak bildirin ve mümkünse şunları ekleyin:

- Etkilenen bileşen ve sürüm
- Tekrar üretme adımları veya kavram kanıtı
- Olası etki
- Önerilen düzeltme

Raporu doğrulamak ve sonraki adımları paylaşmak için makul olan en kısa sürede yanıt verilecektir.

## Tarama sınırı

Canlı denetim özelliği yalnızca sahibi olduğunuz veya test etme izniniz bulunan sistemlerde kullanılmalıdır. SSRF kontrollerini devre dışı bırakmayın ve üretimde `AUDIT_HOST_ALLOWLIST` değerini zorunlu olmadıkça boş bırakın.
