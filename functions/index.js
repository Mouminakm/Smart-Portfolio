// functions/index.js
// Backend for Smart Portfolio.
//   ping       — trivial health check (proves the pipe works)
//   transcribe — receives a recorded clip, returns the text via Deepgram
//                Nova-3 Medical. The Deepgram key is read from a secret here
//                on the server and never reaches the app.

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();

// Run in London; cap server copies as a simple cost guard.
setGlobalOptions({ region: "europe-west2", maxInstances: 5 });

// A handle to the secret we stored. Its VALUE is only readable at runtime,
// inside a function that declares it needs it (see transcribe below).
const deepgramApiKey = defineSecret("DEEPGRAM_API_KEY");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// Specialty-specific keyterms passed to Deepgram Nova-3 to lift recognition of
// procedure vocabulary. Each list is kept focused (~60) — too many keyterms
// cause overfitting. Keyed by the exact profile specialty label.
const KEYTERMS_BY_SPECIALTY = {
  "Neurosurgery": [
    "extradural", "subdural", "epidural", "intradural",
    "haematoma", "haematomas", "haemorrhage",
    "craniotomy", "craniectomy", "cranioplasty",
    "ventriculostomy", "ventriculoperitoneal", "ventricular",
    "laminectomy", "laminoplasty", "discectomy",
    "meningioma", "schwannoma", "cavernoma", "glioma", "adenoma",
    "supratentorial", "infratentorial", "retrosigmoid",
    "trans-sphenoidal", "transsphenoidal",
    "decompression", "decompressive",
    "evacuation", "excision", "biopsy", "drainage",
    "aneurysm", "embolisation", "endovascular", "thrombectomy",
    "endarterectomy", "synostosis",
    "myelomeningocoele", "encephalocoele", "syringomyelia",
    "rhizotomy", "cordotomy", "thalamotomy", "pallidotomy",
    "lumboperitoneal", "syringoperitoneal",
    "odontoid", "foraminotomy", "vertebroplasty",
    "extradural haematoma", "subdural haematoma", "intracerebral haematoma",
    "endoscopic third ventriculostomy", "ventriculoperitoneal shunt",
    "external ventricular drain", "anterior cervical discectomy",
    "carpal tunnel decompression", "microvascular decompression",
    "foramen magnum decompression",
  ],
  "Cardiothoracic Surgery": [
    "sternotomy", "thoracotomy", "thoracoscopy", "VATS", "mediastinotomy",
    "pericardiotomy", "pericardiectomy", "pericardiocentesis",
    "aortic", "mitral", "tricuspid", "pulmonary", "valve",
    "annuloplasty", "valvuloplasty", "valvotomy", "commissurotomy",
    "coronary", "bypass", "graft", "anastomosis",
    "sternal", "mediastinal", "mediastinum", "pleural", "pleurectomy",
    "decortication", "pleurodesis", "pneumonectomy", "lobectomy",
    "segmentectomy", "wedge resection", "bronchoscopy", "endobronchial",
    "thymectomy", "oesophagectomy", "oesophagogastrectomy",
    "aneurysm", "dissection", "endarterectomy", "cannulation",
    "septal", "atrial", "ventricular", "atrioventricular",
    "transplantation", "fenestration", "debridement", "decompression",
    "CABG", "ECMO", "TAVI", "TAVR", "VAD", "LVAD", "IABP", "ASD", "VSD",
    "coronary artery bypass graft", "aortic valve replacement",
    "mitral valve repair", "aortic root replacement",
    "lung resection", "chest drain insertion",
    "extracorporeal membrane oxygenation",
    "ventricular assist device", "atrial septal defect",
    "ventricular septal defect",
  ],
  "General Surgery": [
    "laparoscopy", "laparoscopic", "laparotomy", "appendicectomy", "appendectomy",
    "cholecystectomy", "herniorrhaphy", "hernioplasty", "inguinal", "femoral",
    "incisional", "umbilical", "hiatus", "fundoplication", "gastrectomy",
    "oesophagectomy", "colectomy", "hemicolectomy", "sigmoidectomy", "colostomy",
    "ileostomy", "anastomosis", "haemorrhoidectomy", "fistula", "fissure",
    "pilonidal", "mastectomy", "lumpectomy", "thyroidectomy", "parathyroidectomy",
    "splenectomy", "adrenalectomy", "pancreatectomy", "Whipple", "hepatectomy",
    "cholangiography", "ERCP", "endoscopy", "gastroscopy", "colonoscopy",
    "sigmoidoscopy", "polypectomy", "varicose", "endarterectomy", "aneurysm",
    "amputation", "debridement", "laparoscopic cholecystectomy",
    "inguinal hernia repair", "incisional hernia repair", "right hemicolectomy",
    "anterior resection", "abdominoperineal resection", "emergency laparotomy",
    "diagnostic laparoscopy", "examination under anaesthesia",
  ],
  "Ophthalmology": [
    "phacoemulsification", "phaco", "cataract", "intraocular", "lens", "IOL",
    "capsulotomy", "capsulorhexis", "vitrectomy", "trabeculectomy", "iridotomy",
    "iridectomy", "keratoplasty", "keratectomy", "photocoagulation", "laser",
    "panretinal", "retinal", "detachment", "cryotherapy", "strabismus",
    "squint", "ptosis", "blepharoplasty", "entropion", "ectropion",
    "dacryocystorhinostomy", "DCR", "enucleation", "evisceration", "pterygium",
    "cornea", "corneal", "conjunctiva", "scleral", "glaucoma", "macular",
    "vitreoretinal", "YAG", "selective laser trabeculoplasty", "SLT",
    "intravitreal", "injection", "cross-linking",
    "phacoemulsification and IOL", "pan retinal photocoagulation",
    "trabeculectomy", "vitrectomy", "cataract extraction",
  ],

  "Otolaryngology": [
    "FESS",
    "functional endoscopic sinus surgery",
    "BAHA",
    "DCR",
    "dacryocystorhinostomy",
    "SMR",
    "EUA",
    "tonsillectomy",
    "adenoidectomy",
    "adenotonsillectomy",
    "quinsy",
    "tonsillotomy",
    "myringotomy",
    "grommets",
    "grommet",
    "tympanoplasty",
    "myringoplasty",
    "ossiculoplasty",
    "mastoidectomy",
    "cortical mastoidectomy",
    "stapedectomy",
    "stapedotomy",
    "cholesteatoma",
    "septoplasty",
    "rhinoplasty",
    "septorhinoplasty",
    "turbinoplasty",
    "turbinectomy",
    "turbinate",
    "polypectomy",
    "ethmoidectomy",
    "sphenoidotomy",
    "antrostomy",
    "Draf",
    "uvulopalatopharyngoplasty",
    "microlaryngoscopy",
    "panendoscopy",
    "pharyngoscopy",
    "oesophagoscopy",
    "laryngoscopy",
    "laryngectomy",
    "pharyngolaryngectomy",
    "tracheostomy",
    "cricothyroidotomy",
    "thyroidectomy",
    "hemithyroidectomy",
    "parathyroidectomy",
    "parotidectomy",
    "submandibular gland excision",
    "neck dissection",
    "selective neck dissection",
    "cricopharyngeal",
    "pharyngeal pouch",
    "medialisation",
    "thyroplasty",
    "epistaxis",
    "sphenopalatine",
    "tympanomastoid",
    "cochlear implant",
    "pinnaplasty",
    "otoplasty",
    "nasopharynx",
    "vestibular schwannoma",
    "schwannoma",
    "laryngeal",
    "glossectomy",
    "septal",
    "adenoid",
  ],
  "Trauma and Orthopaedic Surgery": [
    "ORIF",
    "MUA",
    "THR",
    "TKR",
    "DHS",
    "ACL",
    "PCL",
    "MCL",
    "MPFL",
    "TFCC",
    "SLAP",
    "DDH",
    "CTEV",
    "MTPJ",
    "MCPJ",
    "PIPJ",
    "IPJ",
    "AVN",
    "ALIF",
    "PRC",
    "K-wire",
    "intramedullary nail",
    "POP",
    "arthroplasty",
    "hemiarthroplasty",
    "arthrodesis",
    "arthroscopy",
    "arthroscopic",
    "osteotomy",
    "arthrotomy",
    "meniscectomy",
    "meniscal repair",
    "tenodesis",
    "tenotomy",
    "acromioplasty",
    "subacromial decompression",
    "rotator cuff",
    "Bankart",
    "laminectomy",
    "discectomy",
    "foraminotomy",
    "epicondyle",
    "cannulated screws",
    "dynamic hip screw",
    "tension band wiring",
    "olecranon",
    "patella",
    "supracondylar",
    "intracapsular",
    "extracapsular",
    "Dupuytren",
    "carpal tunnel decompression",
    "trigger finger",
    "fasciectomy",
    "metatarsal",
    "metacarpal",
    "calcaneal",
    "talus",
    "scaphoid",
    "malleolus",
    "pilon",
    "tibial plateau",
    "syndesmosis",
    "Weber",
    "femoral nail",
    "tibial nail",
    "total hip replacement",
    "total knee replacement",
    "unicompartmental",
    "hallux valgus",
    "Scarf osteotomy",
    "Akin",
    "bunionectomy",
    "tendoachilles",
    "Achilles",
  ],
  "Oral and Maxillofacial surgery": [
    "TMJ",
    "IMF",
    "ORN",
    "MRONJ",
    "BSSO",
    "DCIA",
    "ALT",
    "GBR",
    "DCR",
    "BAHA",
    "FESS",
    "Le Fort",
    "sagittal split",
    "genioplasty",
    "bimaxillary",
    "orthognathic",
    "mandibulectomy",
    "mandibulotomy",
    "maxillectomy",
    "coronectomy",
    "odontectomy",
    "apicectomy",
    "enucleation",
    "marsupialisation",
    "sequestrectomy",
    "parotidectomy",
    "submandibular",
    "sialolithotomy",
    "sialendoscopy",
    "neck dissection",
    "zygoma",
    "zygomatic",
    "orbital floor",
    "condyle",
    "symphysis",
    "parasymphysis",
    "dentoalveolar",
    "alveolar",
    "osteotomy",
    "osteomyelitis",
    "oroantral",
    "Caldwell-Luc",
    "antrostomy",
    "canthopexy",
    "canthoplasty",
    "cranioplasty",
    "distraction osteogenesis",
    "free flap",
    "fibula flap",
    "radial forearm flap",
    "temporalis",
    "third molar",
    "wisdom tooth",
    "impacted",
    "cleft lip",
    "cleft palate",
    "tongue tie",
    "frenectomy",
    "glossectomy",
    "tracheostomy",
    "mucocele",
    "sublingual",
    "submental",
    "osteonecrosis",
  ],
  "Oral Surgery": [
    "OAC",
    "OAF",
    "ORN",
    "MRONJ",
    "GBR",
    "TMJ",
    "PRF",
    "PRP",
    "coronectomy",
    "odontectomy",
    "apicectomy",
    "periradicular",
    "enucleation",
    "marsupialisation",
    "alveoplasty",
    "frenectomy",
    "fraenectomy",
    "operculectomy",
    "exostosis",
    "tori",
    "torus",
    "vestibuloplasty",
    "sinus lift",
    "sinus augmentation",
    "ridge augmentation",
    "ridge preservation",
    "socket graft",
    "osseointegrated",
    "dental implant",
    "zygomatic implant",
    "pterygoid implant",
    "sialolith",
    "sialendoscopy",
    "mucocele",
    "epulis",
    "gingivectomy",
    "crown lengthening",
    "periimplantitis",
    "autotransplantation",
    "dentoalveolar",
    "supernumerary",
    "impacted",
    "third molar",
    "wisdom tooth",
    "mesioangular",
    "distoangular",
    "Caldwell-Luc",
    "antrostomy",
    "incisional biopsy",
    "excisional biopsy",
    "lingual nerve",
    "inferior alveolar nerve",
    "cryotherapy",
    "Carnoy's",
    "connective tissue graft",
    "free gingival graft",
    "tranexamic acid",
    "osteonecrosis",
    "odontome",
  ],
  "Paediatric Surgery": [
    "OGD",
    "EUA",
    "PEG",
    "ECMO",
    "TOF",
    "VUJ",
    "PUV",
    "PSARP",
    "PPV",
    "ACE",
    "VP shunt",
    "NEC",
    "MLB",
    "RUQ",
    "UDT",
    "orchidopexy",
    "orchidectomy",
    "herniotomy",
    "circumcision",
    "hydrocele",
    "pyloromyotomy",
    "Ramstedt",
    "intussusception",
    "fundoplication",
    "Nissen",
    "gastrostomy",
    "jejunostomy",
    "ileostomy",
    "colostomy",
    "colectomy",
    "pull-through",
    "Hirschsprung",
    "Kasai",
    "portoenterostomy",
    "gastroschisis",
    "exomphalos",
    "omphalocele",
    "Ladd",
    "malrotation",
    "Wilms",
    "neuroblastoma",
    "nephrectomy",
    "nephroureterectomy",
    "pyeloplasty",
    "ureteric reimplantation",
    "cystoscopy",
    "hypospadias",
    "epispadias",
    "thyroglossal",
    "branchial",
    "Sistrunk",
    "appendicectomy",
    "laparotomy",
    "laparoscopy",
    "thoracoscopy",
    "tongue tie",
    "frenulum",
    "sacrococcygeal",
    "undescended testis",
    "testicular torsion",
    "Hickman",
    "portacath",
    "suprapubic",
    "oesophageal atresia",
    "tracheoesophageal fistula",
    "diaphragmatic hernia",
  ],
  "Plastic Surgery": [
    "SSG",
    "FTSG",
    "SMAS",
    "TRAM",
    "DIEP",
    "IGAP",
    "SGAP",
    "SIEA",
    "TUG",
    "BCC",
    "SCC",
    "AVM",
    "FNA",
    "UCL",
    "RCL",
    "free flap",
    "pedicled flap",
    "perforator flap",
    "latissimus dorsi",
    "gracilis",
    "fasciocutaneous",
    "myocutaneous",
    "fasciectomy",
    "Dupuytren",
    "carpal tunnel decompression",
    "trigger finger",
    "flexor tendon",
    "extensor tendon",
    "tenolysis",
    "digital nerve",
    "syndactyly",
    "polydactyly",
    "cleft lip",
    "cleft palate",
    "abdominoplasty",
    "mastopexy",
    "mastectomy",
    "reduction mammaplasty",
    "breast reduction",
    "breast augmentation",
    "breast reconstruction",
    "capsulectomy",
    "blepharoplasty",
    "rhinoplasty",
    "otoplasty",
    "liposuction",
    "brachioplasty",
    "thighplasty",
    "scar revision",
    "Z-plasty",
    "W-plasty",
    "split skin graft",
    "full thickness skin graft",
    "local flap",
    "keystone flap",
    "wide local excision",
    "sentinel lymph node",
    "lymphadenectomy",
    "tissue expander",
    "contracture release",
    "replantation",
    "microsurgery",
    "nailbed",
    "paronychia",
    "ganglion",
    "escharotomy",
    "debridement",
    "burns",
  ],
  "Urology": [
    "TURP",
    "TURBT",
    "PCNL",
    "ESWL",
    "EHL",
    "TVT",
    "PUJ",
    "RAPN",
    "TESE",
    "DMSA",
    "MAG3",
    "SNS",
    "HoLEP",
    "JJ stent",
    "cystoscopy",
    "flexible cystoscopy",
    "ureteroscopy",
    "ureteroscopic",
    "lithotripsy",
    "litholapaxy",
    "cystolitholapaxy",
    "nephrectomy",
    "nephroureterectomy",
    "heminephrectomy",
    "nephrostomy",
    "pyeloplasty",
    "Anderson-Hynes",
    "prostatectomy",
    "radical prostatectomy",
    "cystectomy",
    "cystoprostatectomy",
    "orchidopexy",
    "orchidectomy",
    "vasectomy",
    "vasovasostomy",
    "hydrocele",
    "epididymal",
    "varicocele",
    "circumcision",
    "urethroplasty",
    "urethrotomy",
    "urethral stricture",
    "hypospadias",
    "ureteric stent",
    "ureteric reimplantation",
    "pyelolithotomy",
    "ureterolithotomy",
    "sacrocolpopexy",
    "colposuspension",
    "mid-urethral sling",
    "artificial urinary sphincter",
    "penile prosthesis",
    "Nesbit",
    "botulinum toxin",
    "intravesical",
    "sphincterotomy",
    "adrenalectomy",
    "retropubic",
    "transperineal",
    "brachytherapy",
    "greenlight",
    "holmium",
  ],
  "Vascular": [
    "EVAR",
    "FEVAR",
    "TEVAR",
    "AAA",
    "CEA",
    "AV fistula",
    "GSV",
    "SSV",
    "SFJ",
    "SPJ",
    "PTFE",
    "IVC",
    "CERAB",
    "SEPS",
    "DRIL",
    "endarterectomy",
    "carotid endarterectomy",
    "angioplasty",
    "angiogram",
    "angiography",
    "arteriogram",
    "embolectomy",
    "thrombectomy",
    "thrombolysis",
    "femoropopliteal",
    "femorodistal",
    "aortobifemoral",
    "axillofemoral",
    "aortoiliac",
    "bypass",
    "interposition graft",
    "tube graft",
    "aneurysm",
    "pseudoaneurysm",
    "popliteal aneurysm",
    "infrarenal",
    "suprarenal",
    "juxtarenal",
    "subclavian",
    "brachiocephalic",
    "radiocephalic",
    "arteriovenous fistula",
    "fistuloplasty",
    "varicose veins",
    "sclerotherapy",
    "foam sclerotherapy",
    "phlebectomy",
    "saphenofemoral",
    "endovenous",
    "radiofrequency ablation",
    "EVLA",
    "ligation and stripping",
    "fasciotomy",
    "amputation",
    "above knee amputation",
    "below knee amputation",
    "transmetatarsal",
    "embolisation",
    "stenting",
    "iliac stent",
    "crural",
    "profunda",
    "endovascular aneurysm repair",
  ],
};

// Turn a specialty's keyterm list into URL query params for Deepgram.
function keytermQS(specialty) {
  const terms = KEYTERMS_BY_SPECIALTY[specialty] || [];
  return terms.map((t) => "keyterm=" + encodeURIComponent(t)).join("&");
}

// Verify the caller is a signed-in user of our app before doing any work.
// Reads the "Authorization: Bearer <token>" header, checks the token with
// firebase-admin, and returns the decoded user if valid. If anything is missing
// or invalid, it sends a 401 response and returns null — the caller then stops.
async function requireSignedIn(request, response) {
  const header = request.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    response.status(401).json({ error: "Sign-in required." });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (e) {
    logger.warn("Rejected an invalid token");
    response.status(401).json({ error: "Sign-in required." });
    return null;
  }
}




// --- Health check ----------------------------------------------------------
exports.ping = onRequest((request, response) => {
  logger.info("Ping received");
  response.json({
    message: "Hello from your Smart Portfolio backend!",
    time: new Date().toISOString(),
  });
});

// --- Transcribe an audio clip ----------------------------------------------
// The app sends JSON: { audioBase64: "...", mimeType: "audio/m4a" }
// We return: { transcript: "..." }
exports.transcribe = onRequest(
  { secrets: [deepgramApiKey] }, // declare we need the secret, so it's available
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Use POST." });
        return;
      }

      // Reject anyone who isn't a signed-in user before doing any work.
      const authUser = await requireSignedIn(request, response);
      if (!authUser) return;

      const { audioBase64, mimeType, specialty } = request.body || {};
      if (!audioBase64) {
        response.status(400).json({ error: "No audio provided." });
        return;
      }

      // The app sends audio as base64 TEXT; Deepgram needs raw BYTES.
      // Buffer.from(text, "base64") converts text back into bytes.
      const audioBytes = Buffer.from(audioBase64, "base64");

      // Call Deepgram's pre-recorded endpoint. (Node 24 has fetch built in.)
      const dgResponse = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-3-medical&smart_format=true&mip_opt_out=true&" + keytermQS(specialty),
        {
          method: "POST",
          headers: {
            Authorization: "Token " + deepgramApiKey.value(),
            "Content-Type": mimeType || "audio/m4a",
          },
          body: audioBytes,
        }
      );

      const data = await dgResponse.json();

      if (!dgResponse.ok) {
        logger.error("Deepgram error", data);
        response.status(502).json({ error: "Transcription service error.", detail: data });
        return;
      }

      // Pull the transcript out of Deepgram's response. The ?. ("optional
      // chaining") safely reads deep into the object without crashing if a
      // level is missing; ?? ("nullish coalescing") falls back to "" if so.
      const transcript =
        data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

      response.json({ transcript });
    } catch (error) {
      logger.error("transcribe failed", error);
      response.status(500).json({ error: "Something went wrong transcribing." });
    }
  }
);
// --- Parse a transcript into structured fields -----------------------------
// The app sends JSON: { transcript: "...", fields: [{ id, label, ... }] }
// We ask Claude to return ONLY a JSON object of { fieldId: value }.
exports.parse = onRequest(
    { secrets: [anthropicApiKey] }, // this function may read the Anthropic secret
    async (request, response) => {
      try {
        if (request.method !== "POST") {
          response.status(405).json({ error: "Use POST." });
          return;
        }

        // Reject anyone who isn't a signed-in user before doing any work.
        const authUser = await requireSignedIn(request, response);
        if (!authUser) return;

        const { transcript, fields, procedureNames, consultantNames } = request.body || {};
        logger.info("parse received procedureNames:", Array.isArray(procedureNames) ? procedureNames.length : "none");
        if (!transcript || !fields) {
          response.status(400).json({ error: "Need a transcript and fields." });
          return;
        }
  
        // Build a description of each field. For fields with a fixed option
        // list, show Claude the EXACT allowed labels and require it to return
        // one of them verbatim (or empty) — so we get "Mild Systemic Disease",
        // not "ASA 2". For radio/checkbox booleans, constrain to Yes/No.
        const fieldList = fields
          .map((f) => {
            // enum/select with options -> list the exact labels
            if (f.options && f.options.length) {
              // Show "value=label" so Claude can map spoken grades/codes
              // (e.g. "ASA 2") to the right label ("Mild Systemic Disease").
              const opts = f.options.map((o) => `${o.value}="${o.label}"`).join(", ");
              return `- ${f.id} (${f.label}): choose EXACTLY one label from [${opts}]. ` +
                     `If the dictation gives a number/code (e.g. "ASA 2"), match it to that value. ` +
                     `Return the LABEL text only, or "" if not mentioned.`;
            }
            // radio with options (e.g. Yes/No, or Unknown/No/Yes)
            if (f.inputType === "radio" && f.options && f.options.length) {
              const labels = f.options.map((o) => `"${o.label}"`).join(", ");
              return `- ${f.id} (${f.label}): choose EXACTLY one of [${labels}] or "".`;
            }
            // checkbox boolean
            if (f.inputType === "checkbox") {
              return `- ${f.id} (${f.label}): "Yes" or "No" or "".`;
            }
            // dates: ask for UK numeric format explicitly
            if (f.inputType === "date") {
              return `- ${f.id} (${f.label}): a date in dd-mm-yyyy format (e.g. "25-06-2026"), or "" if not mentioned. Convert spoken dates like "the 25th of June 2026" to this format.`;
            }
            // free text / number / autocomplete
            return `- ${f.id} (${f.label}): free text, or "" if not mentioned.`;
          })
          .join("\n");
  
        // The system prompt sets the rules. The big one: return ONLY JSON.
        const systemPrompt =
          "You extract structured data from a doctor's dictated surgical logbook entry. " +
          "You are given a transcript and a list of fields with their allowed values. " +
          "Return ONLY a JSON object whose keys are the field ids and whose values come " +
          "from the transcript. " +
          "CRITICAL RULES: " +
          "(1) For any field that lists allowed values in [square brackets], you MUST return " +
          "one of those values copied EXACTLY (character for character), or an empty string. " +
          "Never invent a value that is not in the list. " +
          "(2) If the transcript does not clearly indicate a field, return an empty string for it — " +
          "do not guess. " +
          "(3) For names (e.g. consultant), return the full name as spoken, not an abbreviation. " +
          "(4) Output ONLY the JSON object — no text, explanation, or markdown.";
  
        const userPrompt =
          `Transcript:\n${transcript}\n\nFields to extract:\n${fieldList}`;
  
        // Build the system as an array of blocks. The big, unchanging procedure
        // list goes in its own block marked for caching (cache_control), so we
        // only pay full price for it on the first call in each ~5-min window.
        const systemBlocks = [{ type: "text", text: systemPrompt }];
        if (Array.isArray(procedureNames) && procedureNames.length) {
          const listText =
            "When extracting the 'procedure' field, you MUST return EXACTLY one " +
            "name from the following list, copied verbatim (character for " +
            "character), choosing the one that best matches what the surgeon " +
            "described — allowing for spelling, word order, abbreviations and " +
            "filler words. If none clearly matches, return \"\" for procedure. " +
            "Do not return any procedure name that is not in this list.\n\n" +
            "PROCEDURE LIST:\n" + procedureNames.map((n) => "- " + n).join("\n");
          systemBlocks.push({
            type: "text",
            text: listText,
            cache_control: { type: "ephemeral" }, // cache this big static block
          });
        }// The user's own consultants — short, per-user list. Tell Claude to map
        // the (often mis-transcribed) spoken name to EXACTLY one of these names,
        // copied verbatim, or "" if none clearly matches. Not cached (per-user,
        // small). This goes AFTER the cached procedure block so it doesn't break
        // the cache prefix.
        if (Array.isArray(consultantNames) && consultantNames.length) {
          const cText =
            "For the 'responsibleconsultant' field, the surgeon will name a " +
            "consultant. Speech-to-text often mis-spells surnames, so map what " +
            "was said to EXACTLY one name from the list below, copied verbatim " +
            "(e.g. spoken \"McIntosh\" -> \"McKintosh\" if that is in the list; " +
            "\"Off\" -> \"Uff\"). If none is a clear match, return \"\". Return " +
            "the consultant name exactly as written here.\n\n" +
            "CONSULTANT LIST:\n" + consultantNames.map((n) => "- " + n).join("\n");
          systemBlocks.push({ type: "text", text: cText });
        }

        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey.value(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemBlocks,
            messages: [
                { role: "user", content: userPrompt },
                { role: "assistant", content: "{" }, // forces the reply to start as JSON
              ],
          }),
        });
  
        const data = await aiResponse.json();
  
        if (!aiResponse.ok) {
          logger.error("Anthropic error", data);
          response.status(502).json({ error: "AI service error.", detail: data });
          return;
        }
  
        // Claude's reply text sits in data.content[0].text. It should be pure
        // JSON; we parse it into a real object before sending it to the app.
        // We pre-filled the assistant turn with "{", so prepend it back, and
      // strip any stray markdown fences just in case.
        let rawText = "{" + (data?.content?.[0]?.text ?? "");
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsedFields;
        try {
          parsedFields = JSON.parse(rawText);
        } catch (e) {
          // If Claude ever wraps the JSON in stray text, surface the raw reply
          // so we can see what happened rather than crashing.
          logger.error("Could not parse Claude reply as JSON", rawText);
          response.status(502).json({ error: "AI did not return valid JSON.", raw: rawText });
          return;
        }
  
        response.json({ fields: parsedFields });
      } catch (error) {
        logger.error("parse failed", error);
        response.status(500).json({ error: "Something went wrong parsing." });
      }
    }
  );