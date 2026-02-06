#!/usr/bin/env python3
"""
Backend API Test Suite for Echo AI Chat Application
Tests all backend endpoints with realistic Turkish data
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from frontend environment
BACKEND_URL = "https://eski-sevgili-ai.preview.emergentagent.com/api"

class EchoAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_kisi_id = None
        self.test_results = {
            "health_check": False,
            "kisi_create": False,
            "kisi_list": False,
            "kisi_get": False,
            "kisi_delete": False,
            "mesaj_get": False,
            "mesaj_delete": False,
            "chat_api": False,
            "chat_flow": False
        }
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            self.log("Testing health check endpoint...")
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Health check passed: {data}")
                self.test_results["health_check"] = True
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check error: {str(e)}")
            return False
    
    def test_kisi_create(self):
        """Test creating a new person with Turkish personality data"""
        try:
            self.log("Testing person creation...")
            
            # Realistic Turkish personality data
            kisi_data = {
                "isim": "Ayşe",
                "sana_hitap": "Canım",
                "sen_ona_hitap": "Aşkım", 
                "yas": 24,
                "meslek": "Öğretmen",
                "ses_tonu": "Yumuşak ve sevecen",
                "birlikte_sure": "2 yıl",
                "mesaj_uzunlugu": "Orta",
                "favori_emojiler": ["💕", "😊", "🌸"],
                "gulme_stili": "hihihi",
                "sabah_mesaji": "Günaydın canım, nasıl uyudun?",
                "gece_mesaji": "İyi geceler aşkım, tatlı rüyalar",
                "ozlem_ifadesi": "Çok özledim seni",
                "kizgin_tarzi": "Sessizce kızar, sonra konuşur",
                "saka_stili": "Şirin şakalar yapar",
                "sik_sorulan_soru": "Ne yapıyorsun şu an?",
                "sik_kullanilan": ["Canım benim", "Aşkım ya", "Çok tatlısın"],
                "seni_seviyorum": "Seni çok ama çok seviyorum",
                "teselli_tarzi": "Yanındayım, merak etme",
                "gurur_ifadesi": "Seninle gurur duyuyorum",
                "kiskanclik_tarzi": "Hafif kıskanç ama sevimli",
                "ozur_tarzi": "Özür dilerim canım, kırdıysam",
                "iltifat_tarzi": "Çok yakışıklısın, gözlerin çok güzel",
                "istek_tarzi": "Nazlı nazlı ister",
                "mutlu_tarzi": "Çok mutluyum, dans ediyorum",
                "endise_tarzi": "Endişelenince çok konuşur",
                "motivasyon_tarzi": "Sen her şeyi başarırsın canım",
                "favori_yemek": "Mantı",
                "favori_muzik": "Pop müzik",
                "favori_film": "Romantik komedi",
                "hobiler": "Kitap okuma, resim yapma",
                "konusma_konulari": "Gelecek planları, anılar",
                "tutkulari": "Eğitim, sanat",
                "sikayetleri": "Geç kalması",
                "anlasmazliklar": "Film seçimi",
                "birlikte_yapilanlar": "Piknik, sinema, yürüyüş",
                "ozel_sakalar": "Taklit yapması",
                "iyimserlik": "Çok iyimser",
                "plancilik": "Planlı",
                "duygusal_ifade": "Yüksek",
                "romantiklik": "Çok romantik",
                "sosyallik": "Sosyal",
                "stres_tepkisi": "Konuşarak çözer",
                "en_iyi_ozellik": "Anlayışlı olması",
                "unutulmaz_cumle": "Seninle her şey güzel",
                "en_cok_ozlenen": "Sarılması",
                "en_guzel_ani": "İlk buluşma",
                "ozel_lakap": "Prensesim",
                "uc_kelime": ["Sevgi dolu", "Anlayışlı", "Güzel"],
                "profil_emoji": "🌸"
            }
            
            response = requests.post(
                f"{self.base_url}/kisiler",
                json=kisi_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_kisi_id = data["id"]
                self.log(f"✅ Person created successfully: {data['isim']} (ID: {self.test_kisi_id})")
                self.test_results["kisi_create"] = True
                return True
            else:
                self.log(f"❌ Person creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Person creation error: {str(e)}")
            return False
    
    def test_kisi_list(self):
        """Test listing all persons"""
        try:
            self.log("Testing person list...")
            response = requests.get(f"{self.base_url}/kisiler", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Person list retrieved: {len(data)} persons found")
                if self.test_kisi_id:
                    found = any(k["id"] == self.test_kisi_id for k in data)
                    if found:
                        self.log("✅ Created person found in list")
                    else:
                        self.log("⚠️ Created person not found in list")
                self.test_results["kisi_list"] = True
                return True
            else:
                self.log(f"❌ Person list failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Person list error: {str(e)}")
            return False
    
    def test_kisi_get(self):
        """Test getting specific person"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test person get - no test person ID")
            return False
            
        try:
            self.log(f"Testing get person by ID: {self.test_kisi_id}")
            response = requests.get(f"{self.base_url}/kisiler/{self.test_kisi_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Person retrieved: {data['isim']}")
                self.test_results["kisi_get"] = True
                return True
            else:
                self.log(f"❌ Person get failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Person get error: {str(e)}")
            return False
    
    def test_mesaj_get(self):
        """Test getting messages for a person"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test message get - no test person ID")
            return False
            
        try:
            self.log(f"Testing get messages for person: {self.test_kisi_id}")
            response = requests.get(f"{self.base_url}/mesajlar/{self.test_kisi_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Messages retrieved: {len(data)} messages found")
                self.test_results["mesaj_get"] = True
                return True
            else:
                self.log(f"❌ Message get failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Message get error: {str(e)}")
            return False
    
    def test_chat_api(self):
        """Test AI chat functionality"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test chat - no test person ID")
            return False
            
        try:
            self.log("Testing AI chat functionality...")
            
            chat_request = {
                "kisi_id": self.test_kisi_id,
                "mesaj": "Merhaba canım, nasılsın? Çok özledim seni."
            }
            
            response = requests.post(
                f"{self.base_url}/chat",
                json=chat_request,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for AI response
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Chat response received: {data['yanit'][:100]}...")
                self.log(f"✅ Message ID: {data['mesaj_id']}")
                self.test_results["chat_api"] = True
                return True
            else:
                self.log(f"❌ Chat failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Chat error: {str(e)}")
            return False
    
    def test_chat_flow(self):
        """Test complete chat flow with multiple messages"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test chat flow - no test person ID")
            return False
            
        try:
            self.log("Testing complete chat flow...")
            
            messages = [
                "Günaydın aşkım, nasıl uyudun?",
                "Bugün ne yapıyorsun?", 
                "Seni çok özledim"
            ]
            
            for i, mesaj in enumerate(messages, 1):
                self.log(f"Sending message {i}: {mesaj}")
                
                chat_request = {
                    "kisi_id": self.test_kisi_id,
                    "mesaj": mesaj
                }
                
                response = requests.post(
                    f"{self.base_url}/chat",
                    json=chat_request,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.log(f"✅ Response {i}: {data['yanit'][:80]}...")
                else:
                    self.log(f"❌ Message {i} failed: {response.status_code}")
                    return False
            
            # Check if messages were saved
            response = requests.get(f"{self.base_url}/mesajlar/{self.test_kisi_id}", timeout=10)
            if response.status_code == 200:
                messages_data = response.json()
                self.log(f"✅ Chat flow completed: {len(messages_data)} total messages saved")
                self.test_results["chat_flow"] = True
                return True
            else:
                self.log("❌ Could not verify saved messages")
                return False
                
        except Exception as e:
            self.log(f"❌ Chat flow error: {str(e)}")
            return False
    
    def test_mesaj_delete(self):
        """Test deleting messages for a person"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test message delete - no test person ID")
            return False
            
        try:
            self.log(f"Testing delete messages for person: {self.test_kisi_id}")
            response = requests.delete(f"{self.base_url}/mesajlar/{self.test_kisi_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Messages deleted: {data['message']}")
                self.test_results["mesaj_delete"] = True
                return True
            else:
                self.log(f"❌ Message delete failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Message delete error: {str(e)}")
            return False
    
    def test_kisi_delete(self):
        """Test deleting a person and their messages"""
        if not self.test_kisi_id:
            self.log("❌ Cannot test person delete - no test person ID")
            return False
            
        try:
            self.log(f"Testing delete person: {self.test_kisi_id}")
            response = requests.delete(f"{self.base_url}/kisiler/{self.test_kisi_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Person deleted: {data['message']}")
                self.test_results["kisi_delete"] = True
                return True
            else:
                self.log(f"❌ Person delete failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Person delete error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("=" * 60)
        self.log("STARTING ECHO AI BACKEND API TESTS")
        self.log(f"Backend URL: {self.base_url}")
        self.log("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Person Creation", self.test_kisi_create),
            ("Person List", self.test_kisi_list),
            ("Person Get", self.test_kisi_get),
            ("Message Get", self.test_mesaj_get),
            ("AI Chat API", self.test_chat_api),
            ("Chat Flow", self.test_chat_flow),
            ("Message Delete", self.test_mesaj_delete),
            ("Person Delete", self.test_kisi_delete)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            if test_func():
                passed += 1
            else:
                self.log(f"❌ {test_name} FAILED")
        
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        for key, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{key.replace('_', ' ').title()}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log(f"⚠️ {total - passed} tests failed")
            return False

def main():
    tester = EchoAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()