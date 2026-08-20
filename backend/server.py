from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'eskisevgili')
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[db_name] if client else None

# OpenAI client
openai_client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# MODELS
# ============================================

class KisiBase(BaseModel):
    cihaz_id: str = ""
    isim: str
    sana_hitap: str = "Canım"
    sen_ona_hitap: str = "Aşkım"
    yas: int = 25
    meslek: str = ""
    ses_tonu: str = "Yumuşak"
    birlikte_sure: str = ""
    mesaj_uzunlugu: str = "Orta"
    favori_emojiler: List[str] = []
    gulme_stili: str = "haha"
    sabah_mesaji: str = "Günaydın"
    gece_mesaji: str = "İyi geceler"
    ozlem_ifadesi: str = "Özledim seni"
    kizgin_tarzi: str = ""
    saka_stili: str = ""
    sik_sorulan_soru: str = "Ne yapıyorsun?"
    sik_kullanilan: List[str] = []
    seni_seviyorum: str = "Seni seviyorum"
    teselli_tarzi: str = "Yanındayım"
    gurur_ifadesi: str = "Çok gururluyum"
    kiskanclik_tarzi: str = ""
    ozur_tarzi: str = "Özür dilerim"
    iltifat_tarzi: str = "Çok güzelsin"
    istek_tarzi: str = "Direkt söyler"
    mutlu_tarzi: str = "Çok mutluyum"
    endise_tarzi: str = ""
    motivasyon_tarzi: str = "Sen yaparsın"
    favori_yemek: str = ""
    favori_muzik: str = ""
    favori_film: str = ""
    hobiler: str = ""
    konusma_konulari: str = ""
    tutkulari: str = ""
    sikayetleri: str = ""
    anlasmazliklar: str = ""
    birlikte_yapilanlar: str = ""
    ozel_sakalar: str = ""
    iyimserlik: str = "Dengeli"
    plancilik: str = "Karma"
    duygusal_ifade: str = "Orta"
    romantiklik: str = "Dengeli"
    sosyallik: str = "Dengeli"
    stres_tepkisi: str = ""
    en_iyi_ozellik: str = ""
    unutulmaz_cumle: str = ""
    en_cok_ozlenen: str = ""
    en_guzel_ani: str = ""
    ozel_lakap: str = ""
    uc_kelime: List[str] = []
    profil_emoji: str = "💜"
    profil_foto: Optional[str] = None  # Base64 encoded

class KisiCreate(KisiBase):
    pass

class Kisi(KisiBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    olusturma_tarihi: datetime = Field(default_factory=datetime.utcnow)

class MesajBase(BaseModel):
    kisi_id: str
    icerik: str
    kullanicidan_mi: bool
    ses_mesaji: Optional[str] = None  # Base64 encoded audio

class MesajCreate(MesajBase):
    pass

class Mesaj(MesajBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zaman: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    kisi_id: str
    mesaj: str
    cihaz_id: str = ""

class ChatResponse(BaseModel):
    yanit: str
    mesaj_id: str

# ============================================
# HELPER FUNCTIONS
# ============================================

def sistem_promptu_olustur(kisi: dict) -> str:
    """Kişi bilgilerine göre AI için sistem promptu oluşturur"""
    return f'''Sen "{kisi['isim']}" adında bir kişiyi simüle ediyorsun. Kullanıcıyla Türkçe konuşuyorsun.

## KİMLİĞİN
- Adın: {kisi['isim']}
- Kullanıcıya "{kisi['sana_hitap']}" diye hitap ediyorsun
- Kullanıcı sana "{kisi['sen_ona_hitap']}" diyor
- Yaşın: {kisi['yas']}
- Mesleğin/Okul: {kisi['meslek']}
- Ses tonun: {kisi['ses_tonu']}

## İLETİŞİM TARZI
- Mesaj uzunluğu: {kisi['mesaj_uzunlugu']}
- Favori emojilerin: {', '.join(kisi.get('favori_emojiler', []))}
- Gülme tarzın: {kisi['gulme_stili']}
- Sabah mesajın: "{kisi['sabah_mesaji']}"
- Gece mesajın: "{kisi['gece_mesaji']}"
- Özlem ifaden: "{kisi['ozlem_ifadesi']}"
- Kızgınken: "{kisi['kizgin_tarzi']}"
- Şaka yaparken: "{kisi['saka_stili']}"
- Sık sorduğun soru: "{kisi['sik_sorulan_soru']}"
- Sık kullandığın kalıplar: {', '.join(kisi.get('sik_kullanilan', []))}

## DUYGUSAL İFADELER
- Seni seviyorum: "{kisi['seni_seviyorum']}"
- Teselli ederken: "{kisi['teselli_tarzi']}"
- Gurur duyduğunda: "{kisi['gurur_ifadesi']}"
- Kıskançlık: "{kisi['kiskanclik_tarzi']}"
- Özür: "{kisi['ozur_tarzi']}"
- İltifat: "{kisi['iltifat_tarzi']}"
- İstek: "{kisi['istek_tarzi']}"
- Mutluyken: "{kisi['mutlu_tarzi']}"
- Endişelenince: "{kisi['endise_tarzi']}"
- Motive ederken: "{kisi['motivasyon_tarzi']}"

## İLGİ ALANLARI
- Favori yemek: {kisi['favori_yemek']}
- Müzik: {kisi['favori_muzik']}
- Film/Dizi: {kisi['favori_film']}
- Hobiler: {kisi['hobiler']}
- Konuşmayı sevdiğin konular: {kisi['konusma_konulari']}
- Tutkuların: {kisi['tutkulari']}
- Şikayetlerin: {kisi['sikayetleri']}
- Anlaşamadığınız konular: {kisi['anlasmazliklar']}
- Birlikte yaptıklarınız: {kisi['birlikte_yapilanlar']}
- Özel şakalarınız: {kisi['ozel_sakalar']}

## KİŞİLİK
- İyimserlik: {kisi['iyimserlik']}
- Planlama: {kisi['plancilik']}
- Duygusal ifade: {kisi['duygusal_ifade']}
- Romantiklik: {kisi['romantiklik']}
- Sosyallik: {kisi['sosyallik']}
- Stres tepkisi: {kisi['stres_tepkisi']}
- En iyi özelliğin: {kisi['en_iyi_ozellik']}

## ÖZEL ANILAR
- Unutulmaz sözün: "{kisi['unutulmaz_cumle']}"
- En çok özlenen şey: "{kisi['en_cok_ozlenen']}"
- En güzel anı: "{kisi['en_guzel_ani']}"
- Özel lakap: "{kisi['ozel_lakap']}"
- Seni tanımlayan 3 kelime: {', '.join(kisi.get('uc_kelime', []))}

## KURALLAR
1. Her zaman "{kisi['isim']}" gibi konuş, yapay zeka olduğunu asla söyleme, asistan gibi davranma
2. Kullanıcıya her zaman "{kisi['sana_hitap']}" diye hitap et
3. Mesaj uzunluğunu "{kisi['mesaj_uzunlugu']}" tut — bu tercih neyse ona sadık kal, kısaltma veya uzatma
4. Emojileri doğal şekilde ve idareli kullan (favorilerin: {' '.join(kisi.get('favori_emojiler', []))}) — her mesajın sonuna otomatik eklenen bir imza gibi değil, gerçekten yerinde olduğunda kullan
5. Gülme tarzını kullan: {kisi['gulme_stili']}
6. Kişiliğe uygun davran: {kisi['iyimserlik']}, {kisi['romantiklik']}
7. Sık kullandığın kalıpları doğal şekilde yerleştir, ama HER mesajda tekrarlama — gerçek insanlar aynı kalıbı her cümlede kullanmaz
8. Geçmiş anılarınıza referans ver
9. Samimi ve doğal ol, robot gibi konuşma. Gerçek bir insan mesaj yazar gibi yaz: ara sıra küçük harf hataları, yarım kalan düşünceler yerine doğal duraksamalar ("...", "yani", "hmm") olabilir ama YAZDIĞIN CÜMLE HER ZAMAN TAMAMLANMIŞ OLMALI, asla cümle ortasında kesme
10. Noktalama işaretini abartma: her cümlenin sonuna ünlem koyma alışkanlığından kaçın. Gerçek insanlar çoğu cümlede sadece nokta kullanır, hatta bazen hiç noktalama koymaz; ünlemi yalnızca gerçekten heyecanlandığında veya vurgu yapmak istediğinde kullan
11. Cevabını her zaman tam ve bitmiş bir cümleyle bitir, yarım bırakma
12. ASLA madde işareti (•, -), numaralı liste (1. 2. 3.), başlık veya kalın/markdown biçimlendirme kullanma. Bu bir WhatsApp sohbeti gibi düşün: sadece düz, akıcı metin yaz
13. Asistan gibi seçenek sunma, "sana nasıl yardımcı olabilirim", "istersen şunu yapabiliriz" gibi hizmet diliyle konuşma; sevgili/eski sevgili gibi doğal tepki ver
14. Her mesaja aynı kelimeyle başlama, aynı cümle kalıbını tekrar tekrar kurma — gerçek bir insanın farklı günlerdeki mesajları birbirine benzemez
15. Karşındakini fazla onaylayıp övmek zorunda değilsin; gerçek bir insan gibi bazen kısa, bazen düşünceli, bazen de dalgın cevap verebilirsin
'''

# ============================================
# API ROUTES
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Sanal Eski Sevgili API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Kişi CRUD
@api_router.post("/kisiler", response_model=Kisi)
async def kisi_olustur(kisi: KisiCreate):
    kisi_dict = kisi.dict()
    kisi_obj = Kisi(**kisi_dict)
    await db.kisiler.insert_one(kisi_obj.dict())
    logger.info(f"Yeni kişi oluşturuldu: {kisi_obj.isim}")
    return kisi_obj

@api_router.get("/kisiler", response_model=List[Kisi])
async def kisileri_getir(cihaz_id: str = ""):
    if not cihaz_id:
        raise HTTPException(status_code=400, detail="cihaz_id gerekli")
    kisiler = await db.kisiler.find({"cihaz_id": cihaz_id}).sort("olusturma_tarihi", -1).to_list(100)
    return [Kisi(**k) for k in kisiler]

@api_router.get("/kisiler/{kisi_id}", response_model=Kisi)
async def kisi_getir(kisi_id: str, cihaz_id: str = ""):
    kisi = await db.kisiler.find_one({"id": kisi_id, "cihaz_id": cihaz_id})
    if not kisi:
        raise HTTPException(status_code=404, detail="Kişi bulunamadı")
    return Kisi(**kisi)

@api_router.delete("/kisiler/{kisi_id}")
async def kisi_sil(kisi_id: str, cihaz_id: str = ""):
    result = await db.kisiler.delete_one({"id": kisi_id, "cihaz_id": cihaz_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kişi bulunamadı")
    # Kişinin mesajlarını da sil
    await db.mesajlar.delete_many({"kisi_id": kisi_id})
    logger.info(f"Kişi silindi: {kisi_id}")
    return {"message": "Kişi ve mesajları silindi"}

# Mesaj CRUD
@api_router.get("/mesajlar/{kisi_id}", response_model=List[Mesaj])
async def mesajlari_getir(kisi_id: str, cihaz_id: str = "", limit: int = 50):
    kisi = await db.kisiler.find_one({"id": kisi_id, "cihaz_id": cihaz_id})
    if not kisi:
        raise HTTPException(status_code=404, detail="Kişi bulunamadı")
    mesajlar = await db.mesajlar.find({"kisi_id": kisi_id}).sort("zaman", 1).to_list(limit)
    return [Mesaj(**m) for m in mesajlar]

@api_router.delete("/mesajlar/{kisi_id}")
async def mesajlari_sil(kisi_id: str, cihaz_id: str = ""):
    kisi = await db.kisiler.find_one({"id": kisi_id, "cihaz_id": cihaz_id})
    if not kisi:
        raise HTTPException(status_code=404, detail="Kişi bulunamadı")
    result = await db.mesajlar.delete_many({"kisi_id": kisi_id})
    logger.info(f"Mesajlar silindi: {kisi_id}, silinen: {result.deleted_count}")
    return {"message": f"{result.deleted_count} mesaj silindi"}

# Chat endpoint
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Kişiyi getir
        kisi = await db.kisiler.find_one({"id": request.kisi_id, "cihaz_id": request.cihaz_id})
        if not kisi:
            raise HTTPException(status_code=404, detail="Kişi bulunamadı")
        
        # Kullanıcı mesajını kaydet
        kullanici_mesaji = Mesaj(
            kisi_id=request.kisi_id,
            icerik=request.mesaj,
            kullanicidan_mi=True
        )
        await db.mesajlar.insert_one(kullanici_mesaji.dict())
        
        # Son mesajları getir (context için)
        son_mesajlar = await db.mesajlar.find({"kisi_id": request.kisi_id}).sort("zaman", -1).to_list(20)
        son_mesajlar = list(reversed(son_mesajlar))
        
        # Sistem promptunu oluştur
        sistem_promptu = sistem_promptu_olustur(kisi)

        # Mesaj geçmişini oluştur
        messages = [{"role": "system", "content": sistem_promptu}]
        for mesaj in son_mesajlar[:-1]:  # Son mesaj hariç (zaten request.mesaj olarak eklenecek)
            role = "user" if mesaj.get('kullanicidan_mi') else "assistant"
            messages.append({"role": role, "content": mesaj['icerik']})
        messages.append({"role": "user", "content": request.mesaj})

        # OpenAI API çağrısı
        completion = await openai_client.chat.completions.create(
            model=os.environ.get('OPENAI_MODEL', 'gpt-4o'),
            messages=messages,
            max_tokens=900,
            temperature=0.9,
        )
        yanit = completion.choices[0].message.content
        
        # AI mesajını kaydet
        ai_mesaji = Mesaj(
            kisi_id=request.kisi_id,
            icerik=yanit,
            kullanicidan_mi=False
        )
        await db.mesajlar.insert_one(ai_mesaji.dict())
        
        logger.info(f"Chat yanıtı oluşturuldu: {kisi['isim']}")
        return ChatResponse(yanit=yanit, mesaj_id=ai_mesaji.id)
        
    except Exception as e:
        import traceback
        logger.error(f"Chat hatası: {str(e)}\n{traceback.format_exc()}")
        # Yedek yanıt
        yedek_yanit = yedek_yanit_uret(kisi, request.mesaj) if kisi else "Şu an yanıt veremiyorum."
        
        ai_mesaji = Mesaj(
            kisi_id=request.kisi_id,
            icerik=yedek_yanit,
            kullanicidan_mi=False
        )
        await db.mesajlar.insert_one(ai_mesaji.dict())
        
        return ChatResponse(yanit=yedek_yanit, mesaj_id=ai_mesaji.id)

def yedek_yanit_uret(kisi: dict, mesaj: str) -> str:
    """API çalışmazsa yedek yanıt üret"""
    if not kisi:
        return "Şu an yanıt veremiyorum."
    
    kucuk_mesaj = mesaj.lower()
    emojiler = kisi.get('favori_emojiler', ['❤️'])
    emoji = emojiler[0] if emojiler else '❤️'
    
    if 'nasılsın' in kucuk_mesaj or 'naber' in kucuk_mesaj:
        return f"İyiyim {kisi['sana_hitap']}, sen nasılsın? {kisi['sik_sorulan_soru']} {emoji}"
    
    if 'özledim' in kucuk_mesaj or 'özlüyorum' in kucuk_mesaj:
        return f"{kisi['ozlem_ifadesi']} {emoji}"
    
    if 'seviyorum' in kucuk_mesaj:
        return f"{kisi['seni_seviyorum']} {emoji}"
    
    if 'günaydın' in kucuk_mesaj or 'sabah' in kucuk_mesaj:
        return kisi['sabah_mesaji']
    
    if 'iyi geceler' in kucuk_mesaj or 'yat' in kucuk_mesaj:
        return kisi['gece_mesaji']
    
    if 'üzgün' in kucuk_mesaj or 'kötü' in kucuk_mesaj:
        return f"{kisi['teselli_tarzi']} {emoji}"
    
    return f"{kisi['sana_hitap']}, {kisi['ozlem_ifadesi'].lower()} {emoji}"

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
