// generated from https://transform.tools/json-to-typescript

export interface Alert {
  title: string;
  description: string;
  summary: string;
  date: string;
  pubdate: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  comments: any;
  origlink: any;
  image: Image;
  source: Source;
  categories: any[];
  enclosures: any[];
  "atom:@": Atom;
  "atom:id": AtomId;
  "atom:updated": AtomUpdated;
  "atom:published": AtomPublished;
  "atom:author": AtomAuthor;
  "atom:title": AtomTitle;
  "atom:link": AtomLink;
  "atom:summary": AtomSummary;
  "cap:event": CapEvent;
  "cap:effective": CapEffective;
  "cap:expires": CapExpires;
  "cap:status": CapStatus;
  "cap:msgtype": CapMsgtype;
  "cap:category": CapCategory;
  "cap:urgency": CapUrgency;
  "cap:severity": CapSeverity;
  "cap:certainty": CapCertainty;
  "cap:areadesc": CapAreadesc;
  "cap:polygon": CapPolygon;
  "cap:geocode": CapGeocode;
  "cap:parameter": CapParameter;
  meta: Meta;
}

export interface Image {}

export interface Source {}

export interface Atom {}

export interface AtomId {
  "@": GeneratedType;
  "#": string;
}

export interface GeneratedType {}

export interface AtomUpdated {
  "@": GeneratedType2;
  "#": string;
}

export interface GeneratedType2 {}

export interface AtomPublished {
  "@": GeneratedType3;
  "#": string;
}

export interface GeneratedType3 {}

export interface AtomAuthor {
  "@": GeneratedType4;
  name: Name;
}

export interface GeneratedType4 {}

export interface Name {
  "@": GeneratedType5;
  "#": string;
}

export interface GeneratedType5 {}

export interface AtomTitle {
  "@": GeneratedType6;
  "#": string;
}

export interface GeneratedType6 {}

export interface AtomLink {
  "@": GeneratedType7;
}

export interface GeneratedType7 {
  href: string;
}

export interface AtomSummary {
  "@": GeneratedType8;
  "#": string;
}

export interface GeneratedType8 {}

export interface CapEvent {
  "@": GeneratedType9;
  "#": string;
}

export interface GeneratedType9 {}

export interface CapEffective {
  "@": GeneratedType10;
  "#": string;
}

export interface GeneratedType10 {}

export interface CapExpires {
  "@": GeneratedType11;
  "#": string;
}

export interface GeneratedType11 {}

export interface CapStatus {
  "@": GeneratedType12;
  "#": string;
}

export interface GeneratedType12 {}

export interface CapMsgtype {
  "@": GeneratedType13;
  "#": string;
}

export interface GeneratedType13 {}

export interface CapCategory {
  "@": GeneratedType14;
  "#": string;
}

export interface GeneratedType14 {}

export interface CapUrgency {
  "@": GeneratedType15;
  "#": string;
}

export interface GeneratedType15 {}

export interface CapSeverity {
  "@": GeneratedType16;
  "#": string;
}

export interface GeneratedType16 {}

export interface CapCertainty {
  "@": GeneratedType17;
  "#": string;
}

export interface GeneratedType17 {}

export interface CapAreadesc {
  "@": GeneratedType18;
  "#": string;
}

export interface GeneratedType18 {}

export interface CapPolygon {
  "@": GeneratedType19;
  "#": string;
}

export interface GeneratedType19 {}

export interface CapGeocode {
  "@": GeneratedType20;
  valuename: Valuename[];
  value: Value[];
}

export interface GeneratedType20 {}

export interface Valuename {
  "@": GeneratedType21;
  "#": string;
}

export interface GeneratedType21 {}

export interface Value {
  "@": GeneratedType22;
  "#": string;
}

export interface GeneratedType22 {}

export interface CapParameter {
  "@": GeneratedType23;
  valuename: Valuename2;
  value: Value2;
}

export interface GeneratedType23 {}

export interface Valuename2 {
  "@": GeneratedType24;
  "#": string;
}

export interface GeneratedType24 {}

export interface Value2 {
  "@": GeneratedType25;
  "#": string;
}

export interface GeneratedType25 {}

export interface Meta {
  "#ns": N[];
  "@": GeneratedType26[];
  "#xml": Xml;
  "#type": string;
  "#version": string;
  title: string;
  description: any;
  date: string;
  pubdate: string;
  pubDate: string;
  link: string;
  xmlurl: any;
  xmlUrl: any;
  author: string;
  language: any;
  favicon: any;
  copyright: any;
  generator: string;
  cloud: Cloud;
  image: Image2;
  categories: any[];
  "atom:@": Atom2;
  "atom:id": AtomId2;
  "atom:logo": AtomLogo;
  "atom:generator": AtomGenerator;
  "atom:updated": AtomUpdated2;
  "atom:author": AtomAuthor2;
  "atom:title": AtomTitle2;
  "atom:link": AtomLink2;
}

export interface N {
  xmlns?: string;
  "xmlns:cap"?: string;
  "xmlns:ha"?: string;
}

export interface GeneratedType26 {
  xmlns?: string;
  "xmlns:cap"?: string;
  "xmlns:ha"?: string;
}

export interface Xml {
  "": string;
}

export interface Cloud {}

export interface Image2 {
  url: string;
}

export interface Atom2 {
  xmlns: string;
  "xmlns:cap": string;
  "xmlns:ha": string;
}

export interface AtomId2 {
  "@": GeneratedType27;
  "#": string;
}

export interface GeneratedType27 {}

export interface AtomLogo {
  "@": GeneratedType28;
  "#": string;
}

export interface GeneratedType28 {}

export interface AtomGenerator {
  "@": GeneratedType29;
  "#": string;
}

export interface GeneratedType29 {}

export interface AtomUpdated2 {
  "@": GeneratedType30;
  "#": string;
}

export interface GeneratedType30 {}

export interface AtomAuthor2 {
  "@": GeneratedType31;
  name: Name2;
}

export interface GeneratedType31 {}

export interface Name2 {
  "@": GeneratedType32;
  "#": string;
}

export interface GeneratedType32 {}

export interface AtomTitle2 {
  "@": GeneratedType33;
  "#": string;
}

export interface GeneratedType33 {}

export interface AtomLink2 {
  "@": GeneratedType34;
}

export interface GeneratedType34 {
  href: string;
}
