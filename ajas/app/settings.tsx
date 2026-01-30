import { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Button, Checkbox } from "react-native-paper";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PRIVACY_DESCRIPTIONS } from "@/constants/policies";
import { saveSettings, Guardian } from "@/util/Storage";


const TOTAL_STEPS = 3;

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step 1: 글씨 크기
  const [fontSize, setFontSize] = useState(18);
  
  // Step 2: 보호자 설정
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedGuardians, setSelectedGuardians] = useState<string[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  
  // Step 3: 개인정보 동의
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 선택된 보호자 정보 추출
      const guardians: Guardian[] = contacts
        .filter((c) => selectedGuardians.includes(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phoneNumber,
        }));

      // 설정 저장
      await saveSettings({
        fontSize,
        guardians,
        privacyAgreed,
        onboardingCompleted: true,
      });

      router.navigate("/");
    }
  };

  const toggleGuardian = (id: string) => {
    setSelectedGuardians((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const requestContactPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      // 전화번호가 있는 연락처만 필터링하여 변환
      const loadedContacts: Contact[] = data
        .filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact) => ({
          id: contact.id ?? String(Math.random()),
          name: contact.name ?? "이름 없음",
          phoneNumber: contact.phoneNumbers?.[0]?.number ?? "",
        }));

      setContacts(loadedContacts);
      setContactsLoaded(true);
    } else {
      alert("연락처 접근 권한이 필요합니다.\n설정에서 연락처 접근을 허용해주세요.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="title" style={styles.title}>
              글씨 크기
            </ThemedText>
            <ThemedText style={styles.description}>
              아래의 동그라미를 움직여 보기 편한 글씨 크기로 조절하세요
            </ThemedText>

            {/* 예시 텍스트 */}
            <ThemedView style={styles.fontPreviewBox}>
              <ThemedText style={[styles.fontPreview, { fontSize }]}>
                가나다라
              </ThemedText>
            </ThemedView>

            {/* 슬라이더 */}
            <ThemedView style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>작게</ThemedText>
              <ThemedView style={styles.sliderWrapper}>
                <Slider
                  minimumValue={20}
                  maximumValue={34}
                  step={0.5}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumTrackTintColor="#32a151"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#32a151"
                  style={{ flex: 1 }}
                />
              </ThemedView>
              <ThemedText style={styles.sliderLabel}>크게</ThemedText>
            </ThemedView>
          </ThemedView>
        );

      case 1:
        const filteredContacts = contacts.filter((contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumber.includes(searchQuery)
        );

        return (
          <ThemedView style={styles.stepContainer}>
            {/* 제목: 글씨 크기의 1.3배 줄간격 */}
            <ThemedText 
              type="title" 
              style={[
                styles.title, 
                { 
                  fontSize: fontSize, 
                  lineHeight: fontSize * 1.3,
                  marginBottom: fontSize * 0.5 
                }
              ]}
            >
              보호자 설정
            </ThemedText>
            
            {/* 설명: 한 줄로 작성 (자연스러운 줄바꿈 유도), 1.6배 줄간격 */}
            <ThemedText 
              style={[
                styles.description, 
                { 
                  fontSize: fontSize * 0.6, 
                  lineHeight: fontSize,
                  marginBottom: fontSize * 1.0 
                }
              ]}
            >
              보이스피싱으로 의심되는 문자가 올 경우 연락할 보호자를 선택하세요
            </ThemedText>

            {/* 검색창/버튼 영역 */}
            {/* 검색창 또는 연락처 가져오기 버튼 */}
            <ThemedView style={styles.actionArea}>
              {!contactsLoaded ? (
                <Button
                  mode="outlined"
                  onPress={requestContactPermission}
                  // 📍 minHeight를 주어 최소 높이는 보장하되, padding으로 글자 크기에 반응하게 합니다.
                  contentStyle={{ 
                    paddingVertical: fontSize * 0.3, // 글자 크기에 비례한 위아래 여백
                    minHeight: 50 // 최소 높이 (글자 작을 때 대비)
                  }}
                  style={styles.contactButton}
                  labelStyle={{ 
                    fontSize: fontSize * 0.7, 
                    lineHeight: fontSize * 0.7,
                    marginVertical: 0 // 기본 마진 제거
                  }}
                  textColor="#286b3b"
                >
                  연락처에서 가져오기
                </Button>
              ) : (
                <ThemedView style={[
                  styles.searchSection, 
                  { 
                    minHeight: 50, 
                    paddingVertical: fontSize * 0.3 
                  }
                ]}>
                  <Ionicons name="search" size={fontSize * 1.0} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={[
                      styles.searchInput, 
                      { 
                        fontSize: fontSize * 0.6,
                        minHeight: fontSize * 1.3 // 입력창 자체의 최소 높이
                      }
                    ]}
                    placeholder="이름이나 번호로 검색하세요"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                  />
                </ThemedView>
              )}
            </ThemedView>

            {contactsLoaded ? (
              <>
                <ScrollView style={styles.contactList}>
                  {filteredContacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.contactItem}
                      onPress={() => toggleGuardian(contact.id)}
                    >
                      <Checkbox
                        status={
                          selectedGuardians.includes(contact.id)
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() => toggleGuardian(contact.id)}
                        color="#32a151"
                        uncheckedColor="#666"
                      />
                      <ThemedView style={styles.contactInfo}>
                        <ThemedText style={[styles.contactName, { fontSize: fontSize * 0.8 }]}>
                          {contact.name}
                        </ThemedText>
                        <ThemedText style={styles.contactPhone}>
                          {contact.phoneNumber}
                        </ThemedText>
                      </ThemedView>
                    </TouchableOpacity>
                  ))}
                  
                  {/* 검색 결과 없을 때 메시지 */}
                  {filteredContacts.length === 0 && (
                    <ThemedText style={styles.emptyMessage}>
                      찾으시는 분이 없어요.
                    </ThemedText>
                  )}
                </ScrollView>

                {selectedGuardians.length === 0 && (
                  <ThemedText style={styles.warningMessage}>
                    ⚠️ 연락처에 최소 한 명은 등록해야해요
                  </ThemedText>
                )}

                <ThemedText style={styles.selectedCount}>
                  {selectedGuardians.length}명 선택됨
                </ThemedText>
              </>
            ) : (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyMessage}>
                  연락처를 가져와야 해요
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        );

      case 2:
        return (
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="title" style={styles.title}>
              개인정보 보호
            </ThemedText>
            <ThemedText style={styles.description}>
              안전한 서비스 이용을 위해 동의해주세요
            </ThemedText>

            {/* 개인정보 처리방침 버튼 */}
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => setPrivacyExpanded(!privacyExpanded)}
            >
              <ThemedText style={styles.privacyButtonText}>
                 {privacyExpanded ? "▼" : "▶"} {"\t"}개인정보 처리방침 
              </ThemedText>
            </TouchableOpacity>

            {/* 개인정보 처리방침 내용 */}
            {privacyExpanded && (
              <ScrollView style={styles.privacyTextContainer}>
                <ThemedView style={styles.privacyBox}>
                  <ThemedText style={styles.privacyText}>
                    {PRIVACY_DESCRIPTIONS.content}
                  </ThemedText>
                </ThemedView>
              </ScrollView>
            )}

            {/* 동의 체크박스 */}
            <TouchableOpacity
              style={styles.agreeContainer}
              onPress={() => setPrivacyAgreed(!privacyAgreed)}
            >
              <Checkbox
                status={privacyAgreed ? "checked" : "unchecked"}
                onPress={() => setPrivacyAgreed(!privacyAgreed)}
                color="#32a151"
              />
              <ThemedText style={styles.agreeText}>
                개인정보 처리방침에 동의합니다
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      default:
        return null;
    }
  };

  const isNextEnabled = () => {
    switch (currentStep) {
      case 0:
        return true; // 글씨 크기는 항상 활성화
      case 1:
        return selectedGuardians.length > 0; // 보호자 1명 이상 선택
      case 2:
        return privacyAgreed; // 개인정보 동의 필수
      default:
        return true;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>{renderStepContent()}</ThemedView>

      {/* 페이지 인디케이터 */}
      <ThemedView style={styles.indicatorContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              index === currentStep && styles.indicatorActive,
            ]}
            onPress={() => {
              // 현재 단계보다 뒤의 단계로는 이동 불가
              if (index <= currentStep) {
                setCurrentStep(index);
              }
            }}
            disabled={index > currentStep}
          />
        ))}
      </ThemedView>

      {/* 다음으로 버튼 */}
      <ThemedView style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!isNextEnabled()}
          // 📍 내부 여백을 키워 버튼의 전체적인 두께를 조절합니다.
          contentStyle={{ 
            paddingVertical: fontSize * 0.4,
            minHeight: 30 // 하단 버튼은 조금 더 묵직하게 60부터 시작
          }}
          style={[
            styles.button,
            !isNextEnabled() && styles.buttonDisabled,
            { height: 'auto' } // 높이 고정 해제
          ]}
          labelStyle={{ 
            fontSize: fontSize * 0.6, // 글자 크기 그대로 반영
            fontWeight: "bold",
            marginVertical: 0 
          }}
        >
          {currentStep < TOTAL_STEPS - 1 ? "다음으로" : "계속하기"}
        </Button>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    
  },
  content: {
    flex: 1,
  },
  actionArea: {
    height: 60, 
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // 배경은 하얗게
    borderWidth: 1,
    borderColor: "#32a151", // 우리 앱의 포인트 컬러인 초록색
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: "15%",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    marginBottom: 20,
    opacity: 0.7,
    textAlign: "center",
    fontSize: 16,
  },

  // Step 1: 글씨 크기
  fontPreviewBox: {
    backgroundColor: "#e8f5e6",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  fontPreview: {
    fontWeight: "600",
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 10,
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 5
  },
  sliderLabel: {
    fontSize: 18,
    opacity: 0.6,
    paddingHorizontal: 15,
  },

  // Step 2: 보호자 설정
  contactButton: {
    marginBottom: 20,
    marginHorizontal: 30,
    color: "#286b3b",
  },
  contactList: {
    flex: 1,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginLeft: 15,
  },
  contactInfo: {
    marginLeft: "auto",
    alignItems: "flex-end",
    marginRight: 30,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 0.5,
    marginTop: 10,
  },
  contactPhone: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: "500",
  },
  selectedCount: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.6,
    marginTop: 10,
  },
  warningMessage: {
    textAlign: "center",
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 10,
    marginTop: -5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessage: {
    fontSize: 16,
    opacity: 0.6,
    fontWeight: "500",
  },

  // Step 3: 개인정보
  privacyButton: {
    backgroundColor: "#f8fbf8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  privacyTextContainer: {
    maxHeight: 200,
    marginBottom: 20,
    borderRadius: 12,
  },
  privacyBox: {
    backgroundColor: "#f8fbf8",
    padding: 20,
    borderRadius: 12,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  agreeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  agreeText: {
    fontSize: 16,
    marginLeft: 8,
  },

  // 하단
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: "#32a151",
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  button: {
    paddingVertical: 5,
    backgroundColor: "#5DB075",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});
