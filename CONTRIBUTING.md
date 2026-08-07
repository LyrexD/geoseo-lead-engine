# Katkı rehberi

GeoSEO Lead Engine'e katkıda bulunduğunuz için teşekkürler.

## Geliştirme akışı

1. Repoyu fork edin ve değişikliğiniz için kısa isimli bir branch açın.
2. Bağımlılıkları `npm ci` ile kurun.
3. Davranış değişiklikleri için test ekleyin veya mevcut testi güncelleyin.
4. Aşağıdaki kontrolleri çalıştırın:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

5. Pull request açıklamasında problemi, çözümü ve doğrulama yöntemini yazın.

Kapsamı küçük ve commit mesajlarını açıklayıcı tutun. Büyük mimari değişiklikler için uygulamaya başlamadan önce issue açın.

## Hata bildirimi

Tekrar üretme adımları, beklenen/gerçek davranış, işletim sistemi ve Node.js sürümünü ekleyin. Güvenlik açıklarını herkese açık issue olarak paylaşmayın; [SECURITY.md](SECURITY.md) yönergelerini kullanın.
