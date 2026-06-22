import os
import urllib.request
import zipfile

# Hedef klasör (Projeden bağımsız bir yere indirmesi önerilir, şimdilik projeye yakın)
DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'datasets'))

# İndirilecek standart açık kaynak veri setleri
DATASETS = {
    "DIV2K": {
        "url": "http://data.vision.ee.ethz.ch/cvl/DIV2K/DIV2K_valid_HR.zip",
        "description": "Real-ESRGAN Netleştirme eğitimi için standart Yüksek Çözünürlüklü Veri Seti (Validasyon kiti, hızlı iner)"
    },
    "COCO_Val2017": {
        "url": "http://images.cocodataset.org/zips/val2017.zip",
        "description": "Renklendirme (Colorization) eğitimi için standart doğa/insan/nesne Veri Seti (Validasyon kiti)"
    }
}

def download_and_extract(name, info):
    print(f"\n[{name}] {info['description']}")
    
    zip_path = os.path.join(DATASETS_DIR, f"{name}.zip")
    
    if os.path.exists(zip_path) or os.path.exists(os.path.join(DATASETS_DIR, name)):
        print(f" -> {name} zaten indirilmiş veya klasörü mevcut. Atlanıyor...")
        return

    print(f" -> İndiriliyor: {info['url']}")
    try:
        urllib.request.urlretrieve(info['url'], zip_path)
        print(f" -> Başarıyla indirildi. Dosyalar çıkartılıyor...")
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(DATASETS_DIR)
            
        print(f" -> Çıkarma tamamlandı. Zip dosyası temizleniyor...")
        os.remove(zip_path)
        print(f" -> [BAŞARILI] {name} veri seti kullanıma hazır.")
        
    except Exception as e:
        print(f" -> [HATA] {name} indirilirken hata oluştu: {e}")

if __name__ == "__main__":
    print("="*60)
    print("Piksel AI - Otomatik Veri Seti İndirici")
    print("="*60)
    print(f"Hedef Klasör: {DATASETS_DIR}\n")
    
    if not os.path.exists(DATASETS_DIR):
        os.makedirs(DATASETS_DIR)
        
    for name, info in DATASETS.items():
        download_and_extract(name, info)
        
    print("\nTüm işlemler tamamlandı! Artık model eğitimine başlayabilirsiniz.")
