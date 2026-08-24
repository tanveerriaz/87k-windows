# Translation review package — multilingual journey

> **For Tanveer (or a native reviewer).** Every string below was **machine-drafted by the implementing agent** and carries a `// TRANSLATION REVIEW` marker in source. None has been checked by a native speaker. The plan's user-review gate says these must not ship silently to a public deploy.
>
> **How to review:** work top-down — §1 is the safety-critical set and deserves the most care; §2 is ordinary UI copy. Tick the ✅ column, or replace the cell with the wording you want. Singapore usage is the target register (Singapore Mandarin, Bahasa Melayu as used in SG, Singapore Tamil), aimed at **seniors**, read slowly, often aloud.
>
> Sources: `src/client/lib/i18n.ts` (178 keys × 3 locales = 534 strings), `src/server/inference/consent-evidence.ts`, `src/server/inference/mock-provider.ts`, `src/server/facilitation/mock-facilitator.ts`, `src/shared/demo.ts`.
>
> *Refreshed 2026-08-24 for commits `78568d9`, `43ce381` (consent phrase lists + negation guards, §1.1 fully regenerated) and `e232645`, `4954ecc` (nine new keys in §2.19, mock guide templates in §3.2).*

---

## 1. HIGH STAKES — read these first

### 1.1 Consent-detection phrase lists (`src/server/inference/consent-evidence.ts`)

*Regenerated 2026-08-24 against the shipped lists, after commits `78568d9` and `43ce381` narrowed the phrases and added clause-scope negation guards.*

These are **not UI copy**. They are a deterministic veto: an `offer` or `want` extracted by the model is **discarded** unless the participant's raw memory contains one of these phrases. Two failure modes, and the second is the serious one:

- **False negative** — a genuine offer is dropped, the story never matches. Annoying, safe.
- **False positive** — a phrase that is *not* an offer or a want clears the veto, so **an offer the person never made enters matching** and can be shown to a stranger.

#### Negation safety is now handled in code — this is no longer what you are reviewing for

The earlier version of this document asked you to find phrasings that survive negation, because the lists then leaked on six probes. **That has been fixed.** ZH and TA no longer test a bare substring; each candidate match is accepted only if a clause-scope scan finds no negation around it:

- **ZH** — reject if any negator (`不` `没` `未` `无` `甭` `勿` `莫` `并非` `不是` `毫无`, and `别` when not part of `别人`) appears anywhere between the previous sentence boundary and the match. Commas and spaces do not stop the scan, so `我不，愿意教别人` and `我不是很愿意教别人` are both rejected.
- **TA** — reject if the match's own clause contains a negation marker (`வில்லை` or `இல்லை`), **or** if the immediately following sentence does, which catches dangling negations like `நான் விரும்புகிறேன். ஆனால் இல்லை.`
- Both guards are deliberately **fail-closed**: an unrelated negation nearby will also reject a genuine offer. Losing a match is the acceptable error; inventing consent is not.

Verified for this refresh: **all 12 original QA probes and all 5 re-review bypass probes are rejected, 0 leaks**, while the prepared Mandarin fixture still keeps both its offer and its want. Covered by `tests/unit/consent-evidence.test.ts` (**31 tests**, all green), which pins each probe individually alongside positive controls.

**So your job here is phrase naturalness, not negation safety.** Does a Singapore senior actually say this? If a phrase also strikes you as too *broad* — likely to fire on a sentence that expresses no offer or desire — please still flag it, since no amount of negation handling fixes a phrase that was the wrong phrase to begin with.

#### The shipped lists

| lang | kind | phrases (any one must occur, unnegated) | reviewer question | ✅ |
|---|---|---|---|---|
| ZH | offer | `我愿意` · `我可以` · `愿意教` | Do these read as willingness to a senior? Is `我可以` still too broad — it is "I can" but also "I may / it is permitted"? | |
| ZH | want | `我想要` · `想学` | `我想` and `我希望` were **removed** (see below). Is `我想要` natural for an older speaker, or stiff? Is anything now *missing* — a common way a senior would express wanting to meet someone that neither phrase catches? | |
| MS | offer | `saya boleh` · `saya sudi` · `saya sanggup` | `boleh` is very general ("can/may"). Does `saya boleh` reliably read as willingness here? | |
| MS | want | `saya mahu` · `saya ingin` · `saya berharap` | Natural for an older speaker, or too formal? | |
| TA | offer | `நான் கற்பிக்க தயார்` · `நான் உதவ முடியும்` · `நான் பகிர தயார்` | Would a Singapore Tamil senior actually phrase an offer this way? These read quite bookish. | |
| TA | want | `நான் கற்க விரும்புகிறேன்` · `நான் விரும்புகிறேன்` · `எனக்கு ஆசை` | `நான் விரும்புகிறேன்` alone is broad ("I like / I want"). Too loose for a consent signal? | |

English is unchanged and is listed for reference only: offer `i can` / `i could` / `i would be happy to` / `i am happy to` / `i'm happy to` / `i am willing to` / `i'm willing to` / `i can teach` / `i can share` / `i can show` / `i can help`; want `i want` / `i wish` / `i hope` / `i would like` / `i'm looking for` / `i am looking for` / `i miss` / `i want to learn`.

**What changed in the ZH want list, and why it may matter to you:** `我想` was dropped because it also means "I think" — `我想那是1970年代` ("I *think* that was the 1970s") was clearing the want veto. `我希望` was dropped because a bare well-wish (`我希望他好`, "I hope he is well") is not a wish to connect. If you think either removal went too far and a senior's natural phrasing is now missed, say so — that is a false-negative judgement only a native speaker can make.

**Note on `我想` elsewhere:** the same two characters still appear in UI copy — `listenInsteadLink` = `我想聆听`, `consentYesButton` = `是的，我想继续`. There the reading is unambiguously "I would like to" and it is **correct**; the removal above applies only to the detector, and the UI wording was deliberately left alone.

### 1.2 Privacy and consent promises

A mistranslation here changes a promise the product makes, not just its tone.

| key | EN | ZH | MS | TA | ✅ |
|---|---|---|---|---|---|
| `welcomePrivacyNote` | Synthetic demo only · No account · Nothing stored | 仅供虚构演示 · 无需账号 · 不作任何存储 | Demo fiksyen sahaja · Tiada akaun · Tiada apa disimpan | கற்பனை டெமோ மட்டுமே · கணக்கு தேவையில்லை · எதுவும் சேமிக்கப்படாது |  |
| `welcomeEyebrow` | Your words stay private until you choose to light a window | 在你点亮窗口之前，你的话是私密的 | Kata-kata anda kekal peribadi sehingga anda memilih untuk menyalakan tingkap | நீங்கள் ஒரு ஜன்னலை ஒளிரச் செய்யும் வரை உங்கள் வார்த்தைகள் தனிப்பட்டவையாகவே இருக்கும் |  |
| `consentPrivacyNote` | Your choice is private until both people have answered. Either person may say no. | 在双方都作出回答之前，你的选择是私密的。任何一方都可以说不。 | Pilihan anda kekal peribadi sehingga kedua-dua pihak menjawab. Sesiapa boleh berkata tidak. | இருவரும் பதிலளிக்கும் வரை உங்கள் தேர்வு தனிப்பட்டதாகவே இருக்கும். யாரும் வேண்டாம் எனலாம். |  |
| `consentYesButton` | Yes, I would like to continue | 是的，我想继续 | Ya, saya ingin teruskan | ஆம், நான் தொடர விரும்புகிறேன் |  |
| `consentNoButton` | No, not this time | 不，这次不了 | Tidak, bukan kali ini | இல்லை, இந்த முறை வேண்டாம் |  |
| `listenerPrivacyNote` | A trusted community partner would verify listeners before real matching. | 在真正的配对之前，一个受信任的社区伙伴会核实聆听者身份。 | Rakan kongsi komuniti yang dipercayai akan mengesahkan pendengar sebelum pemadanan sebenar. | உண்மையான பொருத்தத்திற்கு முன், நம்பகமான சமூக பங்குதாரர் கேட்பவர்களை சரிபார்ப்பார். |  |
| `invitationDisclaimer` | Approved safe capsule only · no raw words or identifiers | 仅限已批准的安全摘要 · 无原话或身份信息 | Hanya kapsul selamat yang diluluskan · tiada kata-kata asal atau pengenalan | ஒப்புதல் பெற்ற பாதுகாப்பான சுருக்கம் மட்டுமே · மூல வார்த்தைகள் அல்லது அடையாளங்கள் இல்லை |  |
| `guideDisclaimer` | Gemini received only the two approved safe capsules and the visible evidence above. It never saw your raw words. | Gemini只收到了两个已批准的安全摘要和上方可见的证据。它从未看到你的原话。 | Gemini hanya menerima dua kapsul selamat yang diluluskan dan bukti yang kelihatan di atas. Ia tidak pernah melihat kata-kata asal anda. | Gemini ஒப்புதல் பெற்ற இரண்டு பாதுகாப்பான சுருக்கங்களையும் மேலே காணப்படும் ஆதாரத்தையும் மட்டுமே பெற்றது. அது உங்கள் மூல வார்த்தைகளை ஒருபோதும் பார்க்கவில்லை. |  |
| `kopiDisclaimer` | Both people independently chose yes. No contact details are exchanged here, and either person may pause or stop. | 双方各自独立选择了是。这里不会交换任何联系方式，任何一方都可以暂停或停止。 | Kedua-dua pihak memilih ya secara berasingan. Tiada butiran hubungan ditukar di sini, dan sesiapa boleh berhenti seketika atau berhenti. | இருவரும் தனித்தனியாக ஆம் என்று தேர்ந்தெடுத்தனர். இங்கு எந்த தொடர்பு விவரங்களும் பரிமாறப்படாது, யாரும் இடைநிறுத்தலாம் அல்லது நிறுத்தலாம். |  |
| `noIdentifiersBody` | Only Gemma’s short interpretation and the evidence above enter matching. The full quote does not. | 只有Gemma的简短解读和上方证据会进入匹配。完整原话不会。 | Hanya tafsiran ringkas Gemma dan bukti di atas memasuki pemadanan. Petikan penuh tidak. | Gemma-வின் சுருக்கமான விளக்கமும் மேலே உள்ள ஆதாரமும் மட்டுமே பொருத்தத்தில் நுழையும். முழு மேற்கோள் நுழையாது. |  |
| `photoHelpText` | A photo is an optional memory cue. It stays in this browser and is never sent to Gemma. If camera access is denied, choose a file or keep the prepared illustration. | 照片只是一个可选的记忆提示。它只保存在此浏览器中，绝不会发送给Gemma。如果无法访问相机，请选择一个文件或保留预设插图。 | Foto adalah petunjuk kenangan pilihan. Ia kekal dalam pelayar ini dan tidak pernah dihantar kepada Gemma. Jika akses kamera dinafikan, pilih fail atau kekalkan ilustrasi yang disediakan. | புகைப்படம் ஒரு விருப்பமான நினைவு குறிப்பு. இது இந்த உலாவியில் மட்டுமே இருக்கும், Gemma-க்கு ஒருபோதும் அனுப்பப்படாது. கேமரா அணுகல் மறுக்கப்பட்டால், ஒரு கோப்பைத் தேர்ந்தெடுக்கவும் அல்லது தயார் செய்யப்பட்ட விளக்கப்படத்தை வைத்திருங்கள். |  |

### 1.3 The prepared Mandarin demo memory

Added in this task and typed verbatim into the demo on stage, so it is read by an audience.


| constant | text | ✅ |
|---|---|---|
| `PREPARED_RADIO_MEMORY` (EN, reference) | I used to repair radios around Queenstown in the 1970s, and I would be happy to teach someone basic radio repair. |  |
| `PREPARED_RADIO_MEMORY_ZH` | 1970年代，我在女皇镇修理收音机。我愿意教别人基本的收音机维修，我想要认识喜欢修复老收音机的人。 |  |

It deliberately contains `我愿意` and `我想要` so the §1.1 veto keeps its offer and want; the fixture was updated from `我想` to `我想要` when the ZH want list was narrowed, and re-verified to still produce both. Please read it as a **senior speaking naturally**, not as a keyword carrier — if the consent phrases make it sound stilted, the phrases are what should change.

---

## 2. UI strings (`src/client/lib/i18n.ts`) — 178 keys × 3 translated locales = 534 strings

### 2.1

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `landingNavBadge` | PRIVATE UNTIL YOU CHOOSE TO SHARE | 分享之前，始终私密 | Peribadi sehingga anda kongsi | நீங்கள் பகிரும் வரை தனிப்பட்டது |  |
| `landingEyebrow` | A story needs a willing listener | 故事需要一个愿意倾听的人 | Cerita memerlukan pendengar yang rela | ஒரு கதைக்கு விரும்பும் கேட்பவர் தேவை |  |
| `landingHeadline` | What story should not disappear? | 什么故事不该消失？ | Cerita apa yang tidak patut hilang? | எந்த கதை மறைந்துவிடக் கூடாது? |  |
| `landingVideoAriaLabel` | The story of 87K Windows: why the product is named for the roughly 87,000 seniors living alone in Singapore, told through a storyteller and a listener in the same block | 87K Windows的故事：为什么这个产品以新加坡约87,000名独居长者命名，通过同一栋组屋里的讲述者和聆听者讲述 | Kisah 87K Windows: kenapa produk ini dinamakan sempena kira-kira 87,000 warga emas yang tinggal bersendirian di Singapura, diceritakan melalui seorang penutur cerita dan seorang pendengar di blok yang sama | 87K Windows-இன் கதை: சிங்கப்பூரில் தனியாக வசிக்கும் சுமார் 87,000 மூத்த குடிமக்களுக்காக இந்த தயாரிப்புக்கு ஏன் இப்பெயர் சூட்டப்பட்டது என்பது, ஒரே தொகுதியில் உள்ள ஒரு கதை சொல்பவர் மற்றும் ஒரு கேட்பவர் மூலம் சொல்லப்படுகிறது |  |
| `landingCopy` | 87K Windows helps one person share a memory and another choose to listen. Gemma protects the story. Gemini helps the conversation begin, then steps away. | 87K Windows帮助一个人分享记忆，另一个人选择聆听。Gemma保护这个故事。Gemini帮助对话开始，然后退出。 | 87K Windows membantu seorang berkongsi kenangan dan seorang lagi memilih untuk mendengar. Gemma melindungi cerita itu. Gemini membantu perbualan bermula, kemudian berundur. | 87K Windows ஒருவர் ஒரு நினைவைப் பகிரவும் மற்றொருவர் கேட்பதைத் தேர்ந்தெடுக்கவும் உதவுகிறது. Gemma கதையைப் பாதுகாக்கிறது. Gemini உரையாடலைத் தொடங்க உதவி, பின்பு விலகிச் செல்கிறது. |  |
| `landingShareTitle` | I have a story to share | 我有一个故事想要分享 | Saya ada cerita untuk dikongsi | என்னிடம் பகிர விரும்பும் ஒரு கதை உள்ளது |  |
| `landingShareSubtitle` | Share a memory in your own words. | 用你自己的话分享一段记忆。 | Kongsi kenangan dengan kata-kata anda sendiri. | உங்கள் சொந்த வார்த்தைகளில் ஒரு நினைவைப் பகிரவும். |  |
| `landingListenSubtitle` | Offer a little time to listen to someone else's memory. | 花一点时间，聆听别人的记忆。 | Luangkan sedikit masa untuk mendengar kenangan orang lain. | மற்றவரின் நினைவைக் கேட்க சிறிது நேரம் ஒதுக்குங்கள். |  |
| `landingAssuranceContact` | No contact details are shared. | 不会分享任何联系方式。 | Tiada butiran hubungan dikongsikan. | தொடர்பு விவரங்கள் எதுவும் பகிரப்படாது. |  |
| `landingAssuranceConsent` | Both people choose yes. | 双方都需要说是。 | Kedua-dua pihak perlu berkata ya. | இருவரும் ஆம் என்று சொல்ல வேண்டும். |  |
| `landingFooterGemma` | GEMMA PROTECTS THE STORY | GEMMA保护故事 | GEMMA MELINDUNGI CERITA | GEMMA கதையைப் பாதுகாக்கிறது |  |
| `landingFooterGemini` | GEMINI HELPS THE FIRST MINUTE | GEMINI协助开场 | GEMINI MEMBANTU MINIT PERTAMA | GEMINI முதல் நிமிடத்திற்கு உதவுகிறது |  |
| `landingViewWallLink` | View the living wall | 查看实时故事墙 | Lihat dinding cerita langsung | நேரடி கதைச் சுவரைப் பார்க்கவும் |  |
| `landingRoleChoicesAriaLabel` | Choose how you want to take part | 选择你想参与的方式 | Pilih cara anda ingin mengambil bahagian | நீங்கள் எவ்வாறு பங்கேற்க விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும் |  |

### 2.2

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `memoryQuestion` | What small thing made you happy when you were young? | 小时候，什么小事让你开心？ | Apakah perkara kecil yang membuat anda gembira semasa kecil? | நீங்கள் சிறுவயதில் இருந்தபோது எந்த சிறிய விஷயம் உங்களை மகிழ்ச்சியடையச் செய்தது? |  |
| `welcomeEyebrow` | Your words stay private until you choose to light a window | 在你点亮窗口之前，你的话是私密的 | Kata-kata anda kekal peribadi sehingga anda memilih untuk menyalakan tingkap | நீங்கள் ஒரு ஜன்னலை ஒளிரச் செய்யும் வரை உங்கள் வார்த்தைகள் தனிப்பட்டவையாகவே இருக்கும் |  |
| `welcomeHeading` | There is one question worth asking. | 有一个值得问的问题。 | Ada satu soalan yang patut ditanya. | கேட்கத் தகுந்த ஒரு கேள்வி உள்ளது. |  |
| `welcomeSupport` | You can speak, type, or bring an old photo. First, you will see what Gemma noticed. You will also see what remains only your words. | 你可以说、打字，或带一张旧照片。首先，你会看到Gemma注意到了什么。你也会看到哪些内容仍然只属于你自己的话语。 | Anda boleh bercakap, menaip, atau membawa foto lama. Mula-mula, anda akan melihat apa yang Gemma perasan. Anda juga akan melihat apa yang kekal sebagai kata-kata anda sahaja. | நீங்கள் பேசலாம், தட்டச்சு செய்யலாம், அல்லது ஒரு பழைய புகைப்படத்தைக் கொண்டு வரலாம். முதலில், Gemma என்ன கவனித்தது என்பதைப் பார்ப்பீர்கள். என்ன உங்கள் சொந்த வார்த்தைகளாகவே இருக்கும் என்பதையும் நீங்கள் பார்ப்பீர்கள். |  |
| `shareMemoryButton` | Share a prepared memory | 分享一段预设的记忆 | Kongsi kenangan yang disediakan | தயார் செய்யப்பட்ட ஒரு நினைவைப் பகிரவும் |  |
| `listenInsteadLink` | I would like to listen instead | 我想聆听 | Saya ingin mendengar sahaja | நான் கேட்க விரும்புகிறேன் |  |
| `welcomePrivacyNote` | Synthetic demo only · No account · Nothing stored | 仅供虚构演示 · 无需账号 · 不作任何存储 | Demo fiksyen sahaja · Tiada akaun · Tiada apa disimpan | கற்பனை டெமோ மட்டுமே · கணக்கு தேவையில்லை · எதுவும் சேமிக்கப்படாது |  |
| `languageSelectorLabel` | Language | 语言 | Bahasa | மொழி |  |

### 2.3

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `journeyYouShared` | You shared | 你分享了 | Anda berkongsi | நீங்கள் பகிர்ந்தீர்கள் |  |
| `journeyGemmaProtected` | Gemma protected | Gemma保护了 | Gemma melindungi | Gemma பாதுகாத்தது |  |
| `journeyYouApproved` | You approved | 你批准了 | Anda meluluskan | நீங்கள் ஒப்புதல் அளித்தீர்கள் |  |
| `journeyStoryMatched` | A story matched | 故事匹配了 | Cerita dipadankan | கதை பொருந்தியது |  |
| `journeyStillListening` | Still listening | 仍在聆听 | Masih mendengar | இன்னும் கேட்கிறது |  |
| `journeyGeminiGuides` | Gemini guides | Gemini引导 | Gemini membimbing | Gemini வழிகாட்டுகிறது |  |

### 2.4

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `roleSwitchHaveStory` | I have a story | 我有一个故事 | Saya ada cerita | என்னிடம் ஒரு கதை உள்ளது |  |
| `roleSwitchWouldListen` | I would like to listen | 我想聆听 | Saya ingin mendengar | நான் கேட்க விரும்புகிறேன் |  |

### 2.5

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `listenProfileEyebrow` | Offer attention, not advice | 给予关注，而非建议 | Berikan perhatian, bukan nasihat | அறிவுரை அல்ல, கவனத்தை வழங்குங்கள் |  |
| `listenProfileHeading` | I would like to listen. | 我想聆听。 | Saya ingin mendengar. | நான் கேட்க விரும்புகிறேன். |  |
| `listenProfileIntro` | Start with what you can genuinely offer. You will only see a storyteller’s approved invitation. Their private memory and contact details stay hidden. | 先从你能真正提供的开始。你只会看到讲述者已批准的邀请。他们的私人记忆和联系方式不会显示。 | Mulakan dengan apa yang anda benar-benar boleh tawarkan. Anda hanya akan melihat jemputan yang diluluskan oleh penutur cerita. Kenangan peribadi dan butiran hubungan mereka kekal tersembunyi. | நீங்கள் உண்மையிலேயே வழங்கக்கூடியதிலிருந்து தொடங்குங்கள். கதை சொல்பவரின் ஒப்புதல் பெற்ற அழைப்பை மட்டுமே நீங்கள் காண்பீர்கள். அவரது தனிப்பட்ட நினைவும் தொடர்பு விவரங்களும் மறைக்கப்பட்டிருக்கும். |  |
| `languageFieldLabel` | Language I am comfortable using | 我使用自如的语言 | Bahasa yang saya selesa gunakan | நான் வசதியாகப் பயன்படுத்தும் மொழி |  |
| `timeFieldLabel` | Time I can offer | 我能提供的时间 | Masa yang boleh saya tawarkan | நான் வழங்கக்கூடிய நேரம் |  |
| `timeOptionShortConvo` | One short conversation this week | 本周一次简短的交谈 | Satu perbualan ringkas minggu ini | இந்த வாரம் ஒரு குறுகிய உரையாடல் |  |
| `timeOption15Min` | 15 minutes today | 今天15分钟 | 15 minit hari ini | இன்று 15 நிமிடங்கள் |  |
| `timeOptionVisit` | A visit at a partner centre | 在合作中心的一次探访 | Lawatan di pusat rakan kongsi | ஒரு பங்குதாரர் மையத்தில் ஒரு வருகை |  |
| `seeInvitationButton` | See a safe story invitation | 查看安全的故事邀请 | Lihat jemputan cerita yang selamat | பாதுகாப்பான கதை அழைப்பைப் பார்க்கவும் |  |
| `listenerPrivacyNote` | A trusted community partner would verify listeners before real matching. | 在真正的配对之前，一个受信任的社区伙伴会核实聆听者身份。 | Rakan kongsi komuniti yang dipercayai akan mengesahkan pendengar sebelum pemadanan sebenar. | உண்மையான பொருத்தத்திற்கு முன், நம்பகமான சமூக பங்குதாரர் கேட்பவர்களை சரிபார்ப்பார். |  |

### 2.6

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `invitationEyebrow` | Approved story invitation | 已批准的故事邀请 | Jemputan cerita yang diluluskan | ஒப்புதல் பெற்ற கதை அழைப்பு |  |
| `invitationFallbackHeading` | A storyteller has not lit a window yet. | 讲述者尚未点亮窗口。 | Penutur cerita belum menyalakan tingkap. | கதை சொல்பவர் இன்னும் ஒரு ஜன்னலை ஒளிரச் செய்யவில்லை. |  |
| `whatTheyChoseLabel` | WHAT THEY CHOSE TO SHARE | 他们选择分享的内容 | APA YANG MEREKA PILIH UNTUK KONGSI | அவர்கள் பகிர்ந்துகொள்ள தேர்ந்தெடுத்தது |  |
| `invitationFallbackBody` | Ask the storyteller to share first, then return to this room. | 请先请讲述者分享，然后再回到此房间。 | Minta penutur cerita berkongsi dahulu, kemudian kembali ke bilik ini. | கதை சொல்பவரை முதலில் பகிரச் சொல்லுங்கள், பின்னர் இந்த அறைக்குத் திரும்பவும். |  |
| `invitationDisclaimer` | Approved safe capsule only · no raw words or identifiers | 仅限已批准的安全摘要 · 无原话或身份信息 | Hanya kapsul selamat yang diluluskan · tiada kata-kata asal atau pengenalan | ஒப்புதல் பெற்ற பாதுகாப்பான சுருக்கம் மட்டுமே · மூல வார்த்தைகள் அல்லது அடையாளங்கள் இல்லை |  |
| `listenerReasonLabel` | Why would you like to listen? | 你为什么想聆听？ | Kenapa anda ingin mendengar? | நீங்கள் ஏன் கேட்க விரும்புகிறீர்கள்? |  |
| `listenerOfferedPrefix` | You offered: | 你提供了： | Anda menawarkan: | நீங்கள் வழங்கியது: |  |
| `prepareRequestButton` | Prepare my listening request with Gemma | 用Gemma准备我的聆听请求 | Sediakan permintaan mendengar saya dengan Gemma | Gemma மூலம் என் கேட்கும் கோரிக்கையைத் தயார் செய்யவும் |  |
| `changeOfferButton` | Change what I can offer | 修改我能提供的内容 | Tukar apa yang saya boleh tawarkan | நான் வழங்கக்கூடியதை மாற்றவும் |  |

### 2.7

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `listenProcessingEyebrow` | Your reason stays yours until you approve | 在你批准之前，你的理由仍然只属于你 | Sebab anda kekal milik anda sehingga anda meluluskan | நீங்கள் ஒப்புதல் அளிக்கும் வரை உங்கள் காரணம் உங்களுடையதாகவே இருக்கும் |  |
| `listenProcessingHeading` | Gemma is preparing a safe listening capsule. | Gemma正在准备一个安全的聆听摘要。 | Gemma sedang menyediakan kapsul mendengar yang selamat. | Gemma ஒரு பாதுகாப்பான கேட்கும் சுருக்கத்தைத் தயாரிக்கிறது. |  |
| `listenProcessingBody` | Only your language, time and reason to listen enter the evidence check. No contact details are shared. | 只有你的语言、时间和聆听理由会进入证据核查。不会分享任何联系方式。 | Hanya bahasa, masa dan sebab anda untuk mendengar memasuki semakan bukti. Tiada butiran hubungan dikongsi. | உங்கள் மொழி, நேரம் மற்றும் கேட்பதற்கான காரணம் மட்டுமே ஆதார சரிபார்ப்பில் நுழையும். தொடர்பு விவரங்கள் எதுவும் பகிரப்படாது. |  |
| `elapsedSuffix` | s elapsed · This usually takes 10–30 seconds on the local model. | 秒已过 · 在本地模型上通常需要10–30秒。 | saat berlalu · Ini biasanya mengambil masa 10–30 saat pada model tempatan. | வினாடிகள் கடந்துவிட்டன · இது பொதுவாக உள்ளூர் மாதிரியில் 10–30 வினாடிகள் ஆகும். |  |

### 2.8

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `consentEyebrow` | A possible human connection | 一次可能的人际连接 | Kemungkinan hubungan sesama manusia | ஒரு சாத்தியமான மனித தொடர்பு |  |
| `consentHeading` | Would you like this conversation to begin? | 你希望这段对话开始吗？ | Adakah anda ingin perbualan ini bermula? | இந்த உரையாடல் தொடங்க வேண்டுமா? |  |
| `storytellerLabel` | STORYTELLER | 讲述者 | PENUTUR CERITA | கதை சொல்பவர் |  |
| `listenerLabel` | LISTENER | 聆听者 | PENDENGAR | கேட்பவர் |  |
| `consentPrivacyNote` | Your choice is private until both people have answered. Either person may say no. | 在双方都作出回答之前，你的选择是私密的。任何一方都可以说不。 | Pilihan anda kekal peribadi sehingga kedua-dua pihak menjawab. Sesiapa boleh berkata tidak. | இருவரும் பதிலளிக்கும் வரை உங்கள் தேர்வு தனிப்பட்டதாகவே இருக்கும். யாரும் வேண்டாம் எனலாம். |  |
| `consentYesButton` | Yes, I would like to continue | 是的，我想继续 | Ya, saya ingin teruskan | ஆம், நான் தொடர விரும்புகிறேன் |  |
| `consentPending` | Recording your choice… | 正在记录你的选择… | Merekod pilihan anda… | உங்கள் தேர்வைப் பதிவு செய்கிறது… |  |
| `consentNoButton` | No, not this time | 不，这次不了 | Tidak, bukan kali ini | இல்லை, இந்த முறை வேண்டாம் |  |

### 2.9

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `requestedEyebrow` | Your choice is recorded | 你的选择已被记录 | Pilihan anda telah direkodkan | உங்கள் தேர்வு பதிவு செய்யப்பட்டது |  |
| `requestedHeading` | Waiting for the other person. | 正在等待对方。 | Menunggu orang lain. | மற்றவருக்காக காத்திருக்கிறது. |  |
| `requestedBody` | Nothing is arranged unless they independently say yes. You may close this page; the room keeps no contact details. | 除非对方也独立选择是，否则不会安排任何事情。你可以关闭此页面；房间不会保留任何联系方式。 | Tiada apa akan diatur melainkan mereka juga bersetuju secara berasingan. Anda boleh tutup halaman ini; bilik ini tidak menyimpan sebarang butiran hubungan. | அவர்களும் தனித்தனியாக ஆம் என்று சொல்லாவிட்டால் எதுவும் ஏற்பாடு செய்யப்படாது. நீங்கள் இந்தப் பக்கத்தை மூடலாம்; இந்த அறை எந்த தொடர்பு விவரங்களையும் வைத்திருக்காது. |  |
| `yourChoiceLabel` | Your choice | 你的选择 | Pilihan anda | உங்கள் தேர்வு |  |
| `requestSentLabel` | Request sent | 请求已发送 | Permintaan dihantar | கோரிக்கை அனுப்பப்பட்டது |  |
| `otherPersonLabel` | The other person | 对方 | Orang lain | மற்றவர் |  |
| `waitingLabel` | Waiting | 等待中 | Menunggu | காத்திருக்கிறது |  |
| `yesLabel` | Yes | 是 | Ya | ஆம் |  |

### 2.10

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `mutualEyebrow` | Two independent yeses | 两个独立的“是” | Dua jawapan "ya" yang berasingan | இரண்டு தனித்தனி 'ஆம்'கள் |  |
| `mutualHeading` | A listening conversation is ready. | 一次聆听对话已经准备好了。 | Perbualan mendengar sudah sedia. | ஒரு கேட்கும் உரையாடல் தயாராக உள்ளது. |  |
| `mutualStorytellerYes` | Yes, I would like to share. | 是的，我想分享。 | Ya, saya ingin berkongsi. | ஆம், நான் பகிர விரும்புகிறேன். |  |
| `mutualListenerYes` | Yes, I have time to listen. | 是的，我有时间聆听。 | Ya, saya ada masa untuk mendengar. | ஆம், எனக்கு கேட்க நேரம் உள்ளது. |  |
| `conversationStarterLabel` | TWO OPTIONAL FIRST QUESTIONS | 两个可选的开场问题 | DUA SOALAN PEMBUKA PILIHAN | இரண்டு விருப்பமான தொடக்க கேள்விகள் |  |
| `geminiOffersLine` | Gemini offers a beginning. Then it steps away. | Gemini提供一个开场，然后退出。 | Gemini menawarkan permulaan. Kemudian ia berundur. | Gemini ஒரு தொடக்கத்தை வழங்குகிறது. பிறகு அது விலகிச் செல்கிறது. |  |
| `simpleBeginningLine` | A simple beginning based only on the approved capsules. | 仅基于已批准摘要的简单开场。 | Permulaan ringkas berdasarkan kapsul yang diluluskan sahaja. | ஒப்புதல் பெற்ற சுருக்கங்களை மட்டும் அடிப்படையாகக் கொண்ட எளிய தொடக்கம். |  |
| `offerAnotherButton` | Offer another conversation | 再提供一次对话 | Tawarkan satu lagi perbualan | மற்றொரு உரையாடலை வழங்கவும் |  |

### 2.11

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `consentRespectedEyebrow` | Consent respected | 尊重了你的选择 | Persetujuan dihormati | ஒப்புதல் மதிக்கப்பட்டது |  |
| `noConnectionHeading` | No connection was opened. | 没有开启连接。 | Tiada hubungan dibuka. | எந்த தொடர்பும் திறக்கப்படவில்லை. |  |
| `noConnectionBody` | One person said no, or the evidence was not strong enough. Both stories remain separate and no invitation was created. | 有一方说了不，或者证据不够充分。两个故事仍然各自独立，没有创建邀请。 | Seorang berkata tidak, atau bukti tidak mencukupi. Kedua-dua cerita kekal berasingan dan tiada jemputan dicipta. | ஒருவர் வேண்டாம் என்றார், அல்லது ஆதாரம் போதுமானதாக இல்லை. இரண்டு கதைகளும் தனித்தனியாகவே உள்ளன, எந்த அழைப்பும் உருவாக்கப்படவில்லை. |  |
| `returnHomeButton` | Return to the two chairs | 返回两把椅子 | Kembali ke dua kerusi | இரண்டு நாற்காலிகளுக்குத் திரும்பு |  |

### 2.12

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `captureEyebrow` | One gentle question | 一个温和的问题 | Satu soalan yang lembut | ஒரு மென்மையான கேள்வி |  |
| `captureIntro` | There is no right answer. A small detail is enough. | 没有标准答案。一个小细节就足够了。 | Tiada jawapan yang betul. Satu butiran kecil sudah memadai. | சரியான பதில் என்று எதுவும் இல்லை. ஒரு சிறிய விவரமே போதும். |  |
| `addPhotoButton` | Add an old photo | 添加一张旧照片 | Tambah foto lama | ஒரு பழைய புகைப்படத்தைச் சேர்க்கவும் |  |
| `preparedImageStatus` | Prepared demo image selected | 已选择预设的演示图片 | Imej demo yang disediakan dipilih | தயார் செய்யப்பட்ட டெமோ படம் தேர்ந்தெடுக்கப்பட்டது |  |
| `selectedBadgeLabel` | SELECTED | 已选择 | DIPILIH | தேர்ந்தெடுக்கப்பட்டது |  |
| `restorePreparedImageButton` | Restore prepared demo image | 恢复预设的演示图片 | Pulihkan imej demo yang disediakan | தயார் செய்யப்பட்ட டெமோ படத்தை மீட்டெடுக்கவும் |  |
| `photoHelpText` | A photo is an optional memory cue. It stays in this browser and is never sent to Gemma. If camera access is denied, choose a file or keep the prepared illustration. | 照片只是一个可选的记忆提示。它只保存在此浏览器中，绝不会发送给Gemma。如果无法访问相机，请选择一个文件或保留预设插图。 | Foto adalah petunjuk kenangan pilihan. Ia kekal dalam pelayar ini dan tidak pernah dihantar kepada Gemma. Jika akses kamera dinafikan, pilih fail atau kekalkan ilustrasi yang disediakan. | புகைப்படம் ஒரு விருப்பமான நினைவு குறிப்பு. இது இந்த உலாவியில் மட்டுமே இருக்கும், Gemma-க்கு ஒருபோதும் அனுப்பப்படாது. கேமரா அணுகல் மறுக்கப்பட்டால், ஒரு கோப்பைத் தேர்ந்தெடுக்கவும் அல்லது தயார் செய்யப்பட்ட விளக்கப்படத்தை வைத்திருங்கள். |  |
| `preparedRadioImageLabel` | Prepared fictional radio illustration | 预设的虚构收音机插图 | Ilustrasi radio fiksyen yang disediakan | தயார் செய்யப்பட்ட கற்பனை ரேடியோ படம் |  |
| `noMatchFixtureImageLabel` | Text-only no-match fixture | 纯文字的无匹配示例 | Contoh teks sahaja tanpa padanan | உரை மட்டும் கொண்ட பொருத்தமில்லா மாதிரி |  |
| `preparedInMemoryOnlySuffix` | · prepared in memory only | · 仅保存在本地记忆中 | · disediakan dalam memori sahaja | · நினைவகத்தில் மட்டும் தயார் செய்யப்பட்டது |  |
| `noPhotoLabel` | NO PHOTO | 无照片 | TIADA FOTO | புகைப்படம் இல்லை |  |
| `textFixtureLabel` | TEXT FIXTURE | 文字示例 | CONTOH TEKS | உரை மாதிரி |  |
| `yourWordsLabel` | Your words | 你的话 | Kata-kata anda | உங்கள் வார்த்தைகள் |  |
| `yourWordsPlaceholder` | I remember… | 我记得… | Saya ingat… | எனக்கு நினைவிருக்கிறது… |  |
| `listeningStatus` | Listening… pause when you need to | 正在聆听…需要时可暂停 | Mendengar… berhenti seketika bila perlu | கேட்கிறது… தேவைப்படும்போது இடைநிறுத்தவும் |  |
| `speakMemoryButton` | Speak your memory | 说出你的记忆 | Sebutkan kenangan anda | உங்கள் நினைவைப் பேசுங்கள் |  |
| `voiceStaysEditableNote` | Voice stays editable | 语音内容仍可编辑 | Suara kekal boleh disunting | குரல் இன்னும் திருத்தக்கூடியதாக இருக்கும் |  |
| `noMatchFixtureLink` | Use no-match fixture | 使用无匹配示例 | Guna contoh tiada padanan | பொருத்தமில்லா மாதிரியைப் பயன்படுத்தவும் |  |
| `createCapsuleButton` | Create my safe capsule | 创建我的安全摘要 | Cipta kapsul selamat saya | என் பாதுகாப்பான சுருக்கத்தை உருவாக்கவும் |  |

### 2.13

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `processingEyebrow` | Your words, then the meaning | 先是你的话，然后是含义 | Kata-kata anda, kemudian maksudnya | முதலில் உங்கள் வார்த்தைகள், பின்னர் அர்த்தம் |  |
| `processingHeading` | Separating what you said from what may connect. | 将你所说的与可能产生联系的内容分开。 | Memisahkan apa yang anda katakan daripada apa yang mungkin menghubungkan. | நீங்கள் சொன்னதையும் இணைக்கக்கூடியதையும் பிரிக்கிறது. |  |
| `processingBody` | Gemma prepares a small, reviewable memory capsule. It does not fill in names, dates, or details you did not share. | Gemma准备一个简短、可核查的记忆摘要。它不会填补你未曾分享的姓名、日期或细节。 | Gemma menyediakan kapsul kenangan yang kecil dan boleh disemak. Ia tidak mengisi nama, tarikh, atau butiran yang tidak anda kongsikan. | Gemma ஒரு சிறிய, மறுஆய்வு செய்யக்கூடிய நினைவு சுருக்கத்தைத் தயார் செய்கிறது. நீங்கள் பகிராத பெயர்கள், தேதிகள் அல்லது விவரங்களை இது நிரப்பாது. |  |

### 2.14

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `reviewEyebrow` | You remain the author | 你仍然是作者 | Anda kekal sebagai penulis | நீங்களே ஆசிரியராக இருக்கிறீர்கள் |  |
| `reviewHeading` | You decide what enters matching. | 由你决定哪些内容进入匹配。 | Anda yang menentukan apa yang memasuki pemadanan. | பொருத்தத்தில் என்ன நுழையும் என்பதை நீங்களே முடிவு செய்கிறீர்கள். |  |
| `yourWordsCardLabel` | YOUR WORDS | 你的话 | KATA-KATA ANDA | உங்கள் வார்த்தைகள் |  |
| `whatGemmaNoticedLabel` | WHAT GEMMA NOTICED | Gemma注意到的内容 | APA YANG GEMMA PERASAN | Gemma கவனித்தது |  |
| `placeLabel` | PLACE | 地点 | TEMPAT | இடம் |  |
| `eraLabel` | ERA | 年代 | ERA | காலம் |  |
| `skillLabel` | SKILL | 技能 | KEMAHIRAN | திறமை |  |
| `offerLabel` | OFFER | 提供 | TAWARAN | வழங்குவது |  |
| `wantsLabel` | WANTS | 需要 | KEHENDAK | தேவைகள் |  |
| `removedBeforeSharingTitle` | Removed before sharing | 分享前已移除 | Dialih keluar sebelum berkongsi | பகிர்வதற்கு முன் அகற்றப்பட்டது |  |
| `noIdentifiersTitle` | No identifiers detected | 未检测到身份信息 | Tiada pengenalan dikesan | அடையாளங்கள் எதுவும் கண்டறியப்படவில்லை |  |
| `noIdentifiersBody` | Only Gemma’s short interpretation and the evidence above enter matching. The full quote does not. | 只有Gemma的简短解读和上方证据会进入匹配。完整原话不会。 | Hanya tafsiran ringkas Gemma dan bukti di atas memasuki pemadanan. Petikan penuh tidak. | Gemma-வின் சுருக்கமான விளக்கமும் மேலே உள்ள ஆதாரமும் மட்டுமே பொருத்தத்தில் நுழையும். முழு மேற்கோள் நுழையாது. |  |
| `uncertainSummary` | What is uncertain? | 有哪些不确定的地方？ | Apa yang tidak pasti? | என்ன நிச்சயமற்றது? |  |
| `readToMeButton` | Read this to me | 读给我听 | Bacakan untuk saya | இதை எனக்குப் படியுங்கள் |  |
| `stopReadingButton` | Stop reading | 停止朗读 | Hentikan bacaan | படிப்பதை நிறுத்தவும் |  |
| `approveButton` | Approve and light my window | 批准并点亮我的窗口 | Luluskan dan nyalakan tingkap saya | ஒப்புதல் அளித்து என் ஜன்னலை ஒளிரச் செய்யவும் |  |
| `approvePending` | Lighting your window… | 正在点亮你的窗口… | Menyalakan tingkap anda… | உங்கள் ஜன்னலை ஒளிரச் செய்கிறது… |  |
| `goBackButton` | Go back and edit | 返回并编辑 | Kembali dan sunting | திரும்பிச் சென்று திருத்தவும் |  |

### 2.15

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `waitingEyebrow` | Your window is lit | 你的窗口已点亮 | Tingkap anda telah dinyalakan | உங்கள் ஜன்னல் ஒளிர்கிறது |  |
| `waitingHeading` | Your story is now visible as a warm light. | 你的故事现在以温暖的灯光呈现。 | Cerita anda kini kelihatan sebagai cahaya hangat. | உங்கள் கதை இப்போது ஒரு அரவணைப்பான ஒளியாகக் காணப்படுகிறது. |  |
| `waitingBody` | Your approved capsule is being checked for a shared human thread. If the evidence holds, Gemini will prepare a gentle way to begin. | 你已批准的摘要正在被核查是否存在共同的人际线索。如果证据成立，Gemini会准备一个温和的开场方式。 | Kapsul anda yang diluluskan sedang disemak untuk benang manusia yang dikongsi. Jika bukti kukuh, Gemini akan menyediakan cara yang lembut untuk bermula. | பகிரப்பட்ட மனித இழையைப் பொருத்தமாக ஒப்புதல் பெற்ற உங்கள் சுருக்கம் சரிபார்க்கப்படுகிறது. ஆதாரம் நிலைத்திருந்தால், Gemini ஒரு மென்மையான தொடக்க வழியைத் தயார் செய்யும். |  |

### 2.16

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `resultEyebrow` | Your result | 你的结果 | Keputusan anda | உங்கள் முடிவு |  |
| `yourMemoryLabel` | YOUR MEMORY | 你的记忆 | KENANGAN ANDA | உங்கள் நினைவு |  |
| `listenerApprovedReasonLabel` | LISTENER’S APPROVED REASON | 聆听者已批准的理由 | SEBAB YANG DILULUSKAN PENDENGAR | கேட்பவர் ஒப்புதல் அளித்த காரணம் |  |
| `guideLabel` | GEMINI · SENIOR CONNECTION GUIDE | GEMINI · 长者连接向导 | GEMINI · PANDUAN HUBUNGAN WARGA EMAS | GEMINI · மூத்த குடிமக்கள் தொடர்பு வழிகாட்டி |  |
| `englishFallbackLabel` | IN ENGLISH | 英文版 | DALAM BAHASA INGGERIS | ஆங்கிலத்தில் |  |
| `twoQuestionsIntro` | Two optional questions, written for a slower conversation: | 两个可选问题，为一场从容的对话而写： | Dua soalan pilihan, ditulis untuk perbualan yang lebih perlahan: | மெதுவான உரையாடலுக்காக எழுதப்பட்ட இரண்டு விருப்பமான கேள்விகள்: |  |
| `readAloudButton` | Read this aloud | 朗读此内容 | Bacakan ini dengan kuat | இதை உரக்கப் படியுங்கள் |  |
| `guideDisclaimer` | Gemini received only the two approved safe capsules and the visible evidence above. It never saw your raw words. | Gemini只收到了两个已批准的安全摘要和上方可见的证据。它从未看到你的原话。 | Gemini hanya menerima dua kapsul selamat yang diluluskan dan bukti yang kelihatan di atas. Ia tidak pernah melihat kata-kata asal anda. | Gemini ஒப்புதல் பெற்ற இரண்டு பாதுகாப்பான சுருக்கங்களையும் மேலே காணப்படும் ஆதாரத்தையும் மட்டுமே பெற்றது. அது உங்கள் மூல வார்த்தைகளை ஒருபோதும் பார்க்கவில்லை. |  |
| `kopiCardLabel` | SUGGESTED KOPI CARD · FICTIONAL DEMO | 推荐的咖啡卡 · 虚构演示 | KAD KOPI YANG DICADANGKAN · DEMO FIKSYEN | பரிந்துரைக்கப்பட்ட கோப்பி கார்டு · கற்பனை டெமோ |  |
| `kopiDisclaimer` | Both people independently chose yes. No contact details are exchanged here, and either person may pause or stop. | 双方各自独立选择了是。这里不会交换任何联系方式，任何一方都可以暂停或停止。 | Kedua-dua pihak memilih ya secara berasingan. Tiada butiran hubungan ditukar di sini, dan sesiapa boleh berhenti seketika atau berhenti. | இருவரும் தனித்தனியாக ஆம் என்று தேர்ந்தெடுத்தனர். இங்கு எந்த தொடர்பு விவரங்களும் பரிமாறப்படாது, யாரும் இடைநிறுத்தலாம் அல்லது நிறுத்தலாம். |  |
| `runAgainButton` | Run the demo again | 再次运行演示 | Jalankan demo sekali lagi | டெமோவை மீண்டும் இயக்கவும் |  |
| `guidePendingStatus` | Gemini is preparing the first questions… | Gemini正在准备最初的问题… | Gemini sedang menyediakan soalan pertama… | Gemini முதல் கேள்விகளைத் தயார் செய்கிறது… |  |

### 2.17

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `honestDesignEyebrow` | Honest by design | 设计上的诚实 | Jujur mengikut reka bentuk | வடிவமைப்பில் நேர்மை |  |
| `noMatchYetHeading` | NO MATCH YET | 尚无匹配 | BELUM ADA PADANAN | இன்னும் பொருத்தம் இல்லை |  |
| `noMatchHumanLine` | We haven’t found the right listener yet. | 我们还没有找到合适的聆听者。 | Kami belum menemui pendengar yang sesuai. | சரியான கேட்பவரை நாங்கள் இன்னும் கண்டறியவில்லை. |  |
| `noMatchRuleLine` | No invitation was created, and your story remains safe. | 没有创建邀请，你的故事仍然安全。 | Tiada jemputan dicipta, dan cerita anda kekal selamat. | எந்த அழைப்பும் உருவாக்கப்படவில்லை, உங்கள் கதை பாதுகாப்பாகவே உள்ளது. |  |
| `tryPreparedStoryButton` | Try the prepared radio story | 试试预设的收音机故事 | Cuba cerita radio yang disediakan | தயார் செய்யப்பட்ட ரேடியோ கதையை முயற்சிக்கவும் |  |

### 2.18

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `errorLocalModelBusy` | The local model is helping someone else — retrying in a moment… | 本地模型正在帮助别人——稍后会自动重试… | Model tempatan sedang membantu orang lain — mencuba semula sebentar lagi… | உள்ளூர் மாதிரி மற்றொருவருக்கு உதவுகிறது — சிறிது நேரத்தில் மீண்டும் முயற்சிக்கிறது… |  |
| `errorNothingShared` | Nothing was shared. Please try again. | 没有分享任何内容。请再试一次。 | Tiada apa dikongsikan. Sila cuba lagi. | எதுவும் பகிரப்படவில்லை. மீண்டும் முயற்சிக்கவும். |  |
| `errorApprovalNotShared` | The safe capsule was not shared. | 安全摘要未能分享。 | Kapsul selamat tidak dapat dikongsikan. | பாதுகாப்பான சுருக்கம் பகிரப்படவில்லை. |  |
| `errorApprovalFailed` | The safe capsule could not be approved. | 安全摘要未能获得批准。 | Kapsul selamat tidak dapat diluluskan. | பாதுகாப்பான சுருக்கத்தை ஒப்புதல் அளிக்க முடியவில்லை. |  |
| `errorCapsuleNotCreated` | The safe capsule could not be created. | 无法创建安全摘要。 | Kapsul selamat tidak dapat dicipta. | பாதுகாப்பான சுருக்கத்தை உருவாக்க முடியவில்லை. |  |
| `errorListeningRequestFailed` | Your listening request could not be prepared. | 你的聆听请求未能准备好。 | Permintaan mendengar anda tidak dapat disediakan. | உங்கள் கேட்கும் கோரிக்கையைத் தயார் செய்ய முடியவில்லை. |  |
| `errorChoiceNotRecorded` | Your choice could not be recorded. | 你的选择未能被记录。 | Pilihan anda tidak dapat direkodkan. | உங்கள் தேர்வைப் பதிவு செய்ய முடியவில்லை. |  |
| `errorVoiceUnavailable` | Voice capture is not available in this browser. You can type your memory instead. | 此浏览器不支持语音输入。你可以改为输入你的记忆。 | Input suara tidak tersedia dalam pelayar ini. Anda boleh menaip kenangan anda. | இந்த உலாவியில் குரல் உள்ளீடு கிடைக்கவில்லை. நீங்கள் உங்கள் நினைவைத் தட்டச்சு செய்யலாம். |  |
| `errorVoiceNotClear` | We could not hear that clearly. You can try again or type your memory. | 我们没能听清楚。你可以再试一次，或改为输入。 | Kami tidak dapat mendengar dengan jelas. Anda boleh cuba lagi atau menaip. | எங்களால் தெளிவாகக் கேட்க முடியவில்லை. நீங்கள் மீண்டும் முயற்சிக்கலாம் அல்லது தட்டச்சு செய்யலாம். |  |
| `errorVoiceLanguageUnavailable` | Voice input isn't available for this language on this phone — please type. | 此手机不支持此语言的语音输入——请改为输入。 | Input suara tidak tersedia untuk bahasa ini pada telefon ini — sila menaip. | இந்த மொழிக்கான குரல் உள்ளீடு இந்த மொபைலில் கிடைக்கவில்லை — தயவுசெய்து தட்டச்சு செய்யவும். |  |
| `errorReadAloudUnavailableGuide` | Read aloud is not available in this browser. The full guide remains on screen. | 此浏览器不支持朗读功能。完整向导内容仍会显示在屏幕上。 | Bacaan kuat tidak tersedia dalam pelayar ini. Panduan penuh kekal di skrin. | இந்த உலாவியில் உரக்கப் படிப்பது கிடைக்கவில்லை. முழு வழிகாட்டியும் திரையில் உள்ளது. |  |
| `errorReadAloudUnavailableCapsule` | Read aloud is not available in this browser. The full capsule remains on screen. | 此浏览器不支持朗读功能。完整摘要内容仍会显示在屏幕上。 | Bacaan kuat tidak tersedia dalam pelayar ini. Kapsul penuh kekal di skrin. | இந்த உலாவியில் உரக்கப் படிப்பது கிடைக்கவில்லை. முழு சுருக்கமும் திரையில் உள்ளது. |  |
| `errorRoomUnreachable` | We couldn't reach the room right now. Please try again in a moment. | 我们暂时无法连接到房间。请稍后再试。 | Kami tidak dapat menghubungi bilik sekarang. Sila cuba lagi sebentar lagi. | இப்போது அறையை அடைய முடியவில்லை. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும். |  |
| `errorRoomNoResponse` | The room did not respond. Check the connection and try again. | 房间没有响应。请检查网络连接后重试。 | Bilik tidak bertindak balas. Semak sambungan dan cuba lagi. | அறை பதிலளிக்கவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும். |  |
| `errorConnectionFailed` | Could not connect to the room. | 无法连接到房间。 | Tidak dapat menyambung ke bilik. | அறையுடன் இணைக்க முடியவில்லை. |  |
| `errorPhotoFallback` | Use the prepared photo instead. | 请改用预设照片。 | Guna foto yang disediakan sebagai gantinya. | பதிலாக தயார் செய்யப்பட்ட புகைப்படத்தைப் பயன்படுத்தவும். |  |
| `errorRoomMoved` | This room has moved to another story. Your completed result is no longer active; review your memory and try again when the room is ready. | 此房间已切换到另一个故事。你已完成的结果不再有效；请查看你的记忆并在房间准备好后重试。 | Bilik ini telah beralih ke cerita lain. Keputusan anda yang telah selesai tidak lagi aktif; semak kenangan anda dan cuba lagi apabila bilik sudah bersedia. | இந்த அறை மற்றொரு கதைக்கு மாறிவிட்டது. நீங்கள் முடித்த முடிவு இனி செயலில் இல்லை; உங்கள் நினைவைப் பரிசீலித்து அறை தயாராகும்போது மீண்டும் முயற்சிக்கவும். |  |
| `errorListenerRoomMoved` | This room has moved to another story. When a new window is lit, you can offer to listen again. | 此房间已切换到另一个故事。当有新的窗口点亮时，你可以再次提出聆听。 | Bilik ini telah beralih ke cerita lain. Apabila tingkap baharu dinyalakan, anda boleh menawarkan diri untuk mendengar sekali lagi. | இந்த அறை மற்றொரு கதைக்கு மாறிவிட்டது. புதிய ஜன்னல் ஒளிரும்போது, நீங்கள் மீண்டும் கேட்க முன்வரலாம். |  |
| `errorDisplaced` | Another participant shared after you. Your story was not matched; review it and try again when the room is ready. | 另一位参与者在你之后分享了。你的故事未被匹配；请查看并在房间准备好后重试。 | Peserta lain berkongsi selepas anda. Cerita anda tidak dipadankan; semak semula dan cuba lagi apabila bilik sudah bersedia. | மற்றொரு பங்கேற்பாளர் உங்களுக்குப் பிறகு பகிர்ந்தார். உங்கள் கதை பொருத்தப்படவில்லை; அதைப் பரிசீலித்து அறை தயாராகும்போது மீண்டும் முயற்சிக்கவும். |  |
| `mutualFallbackQuestion1` | What did you enjoy about fixing something that others had given up on? | 你喜欢修理别人已经放弃的东西的哪一点？ | Apakah yang anda nikmati tentang membaiki sesuatu yang telah dilepaskan oleh orang lain? | மற்றவர்கள் கைவிட்டதை சரிசெய்வதில் நீங்கள் எதை ரசித்தீர்கள்? |  |
| `mutualFallbackQuestion2` | What do you remember first when you think of Queenstown? | 当你想起女皇镇时，你最先记得什么？ | Apakah yang anda ingat pertama kali apabila anda memikirkan Queenstown? | குயின்ஸ்டவுனை நினைக்கும்போது முதலில் உங்களுக்கு என்ன நினைவுக்கு வருகிறது? |  |
| `roomLabelPrefix` | ROOM | 房间 | BILIK | அறை |  |
| `progressAriaLabel` | Progress | 进度 | Kemajuan | முன்னேற்றம் |  |
| `evidencePathAriaLabel` | Evidence path | 证据路径 | Laluan bukti | ஆதார பாதை |  |
| `invitationImageAlt` | Fictional keepsakes including a radio and a kopi cup | 虚构的纪念物，包括收音机和咖啡杯 | Barangan kenangan fiksyen termasuk radio dan cawan kopi | ரேடியோ மற்றும் கோப்பி கப் உள்ளிட்ட கற்பனை நினைவுப் பொருட்கள் |  |
| `previewImageAlt` | Chosen preview; it has not been shared | 已选择的预览；尚未分享 | Pratonton yang dipilih; ia belum dikongsikan | தேர்ந்தெடுக்கப்பட்ட முன்னோட்டம்; இது இன்னும் பகிரப்படவில்லை |  |
| `memoryObjectsImageAlt` | Fictional memory objects including a radio, kopi cup and keepsakes | 虚构的记忆物品，包括收音机、咖啡杯和纪念品 | Objek kenangan fiksyen termasuk radio, cawan kopi dan barangan kenangan | ரேடியோ, கோப்பி கப் மற்றும் நினைவுப் பொருட்கள் உள்ளிட்ட கற்பனை நினைவு பொருட்கள் |  |
| `dismissButton` | Dismiss | 关闭 | Tutup | மூடு |  |

### 2.19 Deterministic server text, now rendered per participant (added by the F2 fix, commit `e232645`)

⚠️ **Higher stakes than the rest of §2.** These were English-only until this fix, and they carry the *reason to consent*: `matchWhy*` is the sentence a participant reads on the consent screen just before deciding yes or no, and `resultMutualYesTitle` / `kopi*` are the closing screen. `{place}`, `{era}`, `{skill}` are interpolated with **canonical English** capsule values (Task 4), so a translated sentence will contain English nouns — please check the resulting mixed-script sentence reads naturally, not just the template.

| key | EN | ZH 中文 | MS Bahasa Melayu | TA தமிழ் | ✅ |
|---|---|---|---|---|---|
| `matchWhyComplement` | These memories connect through {place} and {skill}. One person offered to share; the other asked to learn. | 这段记忆通过{place}和{skill}相连。一方提出分享，另一方想要学习。 | Kenangan ini berhubung melalui {place} dan {skill}. Seorang menawarkan untuk berkongsi; seorang lagi ingin belajar. | இந்த நினைவுகள் {place} மற்றும் {skill} மூலம் இணைகின்றன. ஒருவர் பகிர முன்வந்தார்; மற்றவர் கற்க விரும்பினார். |  |
| `matchWhyShared` | These memories connect through {place}, {era} and {skill}. | 这段记忆通过{place}、{era}和{skill}相连。 | Kenangan ini berhubung melalui {place}, {era} dan {skill}. | இந்த நினைவுகள் {place}, {era} மற்றும் {skill} மூலம் இணைகின்றன. |  |
| `matchWhyNoMatch` | These two approved memories do not contain enough shared and complementary evidence yet. | 这两份已批准的记忆尚未包含足够的共同和互补证据。 | Kedua-dua kenangan yang diluluskan ini belum mengandungi bukti yang cukup dikongsi dan saling melengkapi. | ஒப்புதல் பெற்ற இந்த இரண்டு நினைவுகளும் இன்னும் போதுமான பொதுவான மற்றும் கூடுதலான ஆதாரத்தைக் கொண்டிருக்கவில்லை. |  |
| `matchPlaceFallback` | a place | 一个地方 | satu tempat | ஒரு இடம் |  |
| `matchEraFallback` | a shared era | 一个共同的年代 | satu era yang dikongsi | ஒரு பொதுவான காலம் |  |
| `matchSkillFallback` | a shared interest | 一个共同的兴趣 | satu minat yang dikongsi | ஒரு பொதுவான ஆர்வம் |  |
| `resultMutualYesTitle` | You both said yes. | 双方都说了是。 | Kedua-dua pihak berkata ya. | இருவரும் ஆம் என்றனர். |  |
| `kopiInvitationLine` | Would you both like to listen and continue this story together? | 你们想一起聆听并继续这段故事吗？ | Adakah anda berdua ingin mendengar dan meneruskan cerita ini bersama-sama? | நீங்கள் இருவரும் ஒன்றாகக் கேட்டு இந்தக் கதையைத் தொடர விரும்புகிறீர்களா? |  |
| `kopiActivityLine` | A gentle conversation can begin. Either person may pause or stop at any time. | 一次温和的对话可以开始了。任何一方都可以随时暂停或停止。 | Perbualan yang lembut boleh bermula. Sesiapa boleh berhenti seketika atau berhenti pada bila-bila masa. | ஒரு மென்மையான உரையாடல் தொடங்கலாம். யாரும் எப்போது வேண்டுமானாலும் இடைநிறுத்தலாம் அல்லது நிறுத்தலாம். |  |

---

## 3. Mock-mode text (no model involved)

### 3.1 Mock-provider canned capsule summaries (`src/server/inference/mock-provider.ts`)

| constant | EN | ZH | MS | TA | ✅ |
|---|---|---|---|---|---|
| `RADIO_SAFE_SUMMARY` | A fictional memory of repairing radios in Queenstown in the 1970s, with an offer to share the skill. | 一段关于1970年代在女皇镇修理收音机的虚构记忆，并愿意分享这项技能。 | Kenangan fiksyen membaiki radio di Queenstown pada tahun 1970-an, dengan tawaran untuk berkongsi kemahiran ini. | 1970களில் குயின்ஸ்டவுனில் ரேடியோக்களை பழுதுபார்த்த ஒரு கற்பனை நினைவு, அந்த திறமையைப் பகிர்ந்து கொள்ளும் ஒரு வாய்ப்புடன். |  |
| `NO_MATCH_SAFE_SUMMARY` | A fictional memory about cataloguing polar clouds in Antarctica in the 2010s. | 一段关于2010年代在南极洲编目极地云层的虚构记忆。 | Kenangan fiksyen tentang mengkatalog awan kutub di Antartika pada tahun 2010-an. | 2010களில் அண்டார்டிகாவில் துருவ மேகங்களை பட்டியலிட்ட ஒரு கற்பனை நினைவு. |  |

### 3.2 Mock-facilitator guide templates (`src/server/facilitation/mock-facilitator.ts`, added by the F4 fix)

These are the guide a participant sees whenever the room runs **without** hosted Gemini — `npm run demo:mock`, the whole e2e suite, and any fallback demo. No model is involved: `{topic}` is interpolated with a **canonical English** skill (e.g. "radio repair"), so again please read the filled sentence, not just the template.

| row | EN | ZH | MS | TA | ✅ |
|---|---|---|---|---|---|
| introduction | You both have a {topic} story to explore. | 你们都有一个关于{topic}的故事可以探索。 | Anda berdua mempunyai cerita tentang {topic} untuk diterokai. | உங்கள் இருவருக்கும் {topic} பற்றிய ஒரு கதை ஆராய உள்ளது. |  |
| question 1 | Would you like to share what made {topic} memorable? | 你愿意分享是什么让{topic}变得难忘吗？ | Adakah anda ingin berkongsi apa yang menjadikan {topic} tidak dapat dilupakan? | {topic}-ஐ மறக்கமுடியாததாக ஆக்கியது என்ன என்பதைப் பகிர விரும்புகிறீர்களா? |  |
| question 2 | Would you like to hear what the other person hopes to learn? | 你想听听对方希望学到什么吗？ | Adakah anda ingin mendengar apa yang diharapkan oleh orang lain untuk dipelajari? | மற்றவர் என்ன கற்க விரும்புகிறார் என்பதைக் கேட்க விரும்புகிறீர்களா? |  |
| consentReminder | Either person may pause or stop at any time. | 任何一方都可以随时暂停或停止。 | Sesiapa boleh berhenti seketika atau berhenti pada bila-bila masa. | யாரும் எப்போது வேண்டுமானாலும் இடைநிறுத்தலாம் அல்லது நிறுத்தலாம். |  |
