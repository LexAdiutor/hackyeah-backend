import { COUNTRIES } from './countries';

interface Question {
  name: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  showOn?: string;
  vanishOn?: string;
  default?: string;
}

interface RadioQuestion extends Question {
  type: 'radio';
  options: string[];
}

interface SelectQuestion extends Question {
  type: 'select';
  options: string[];
}

interface TextQuestion extends Question {
  type: 'text';
  title: string;
}

export const FORM: (RadioQuestion | SelectQuestion | TextQuestion)[] = [
  {
    name: 'entity',
    type: 'radio',
    title: 'Podmiot składający deklarację',
    required: true,
    options: [
      'Podmiot zobowiązany solidarnie do zapłaty podatku',
      'Strona umowy zamiany',
      'Wspólnik spółki cywilnej',
      'Podmiot, o którym mowa w art. 9 pkt 10 lit. b ustawy (pożyczkobiorca)',
      'Inny podmiot',
    ],
  },
  {
    name: 'taxprayerType',
    type: 'radio',
    title: 'Rodzaj podatnika',
    required: false,
    options: ['podatnik niebędący osobą fizyczną', 'osoba fizyczna'],
    default: 'podatnik niebędący osobą fizyczną',
  },
  {
    name: 'taxId',
    type: 'radio',
    title: 'Identyfikator podatkowy',
    required: false,
    options: ['NIP', 'PESEL'],
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'nip',
    type: 'text',
    title: 'Identyfikator podatkowy NIP',
    required: true,
    showOn: 'taxprayerType:podatnik niebędący osobą fizyczną|taxId:NIP|taxId:',
  },
  {
    name: 'pesel',
    type: 'text',
    title: 'Identyfikator numer PESEL',
    required: true,
    showOn: 'taxId:PESEL',
  },
  {
    name: 'fullname',
    type: 'text',
    title: 'Nazwa pełna',
    required: true,
    showOn: 'taxprayerType:podatnik niebędący osobą fizyczną',
  },
  {
    name: 'shortName',
    type: 'text',
    title: 'Nazwa skrócona',
    required: true,
    showOn: 'taxprayerType:podatnik niebędący osobą fizyczną',
  },
  {
    name: 'firstName',
    type: 'text',
    title: 'Pierwsze imię',
    required: true,
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'surname',
    type: 'text',
    title: 'Nazwisko',
    required: true,
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'birthDate',
    type: 'text',
    title: 'Data urodzenia',
    required: true,
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'fathersFirstName',
    type: 'text',
    title: 'Imię ojca',
    required: false,
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'mothersFirstName',
    type: 'text',
    title: 'Imię matki',
    required: false,
    showOn: 'taxprayerType:osoba fizyczna',
  },
  {
    name: 'country',
    type: 'select',
    title: 'Kraj',
    required: true,
    options: COUNTRIES,
    default: 'POLSKA',
  },
  {
    name: 'province',
    type: 'select',
    title: 'Województwo',
    required: true,
    options: [
      'DOLNOŚLĄSKIE',
      'KUJAWSKO-POMORSKIE',
      'LUBELSKIE',
      'LUBUSKIE',
      'ŁÓDZKIE',
      'MAŁOPOLSKIE',
      'MAZOWIECKIE',
      'OPOLSKIE',
      'PODKARPACKIE',
      'PODLASKIE',
      'POMORSKIE',
      'ŚLĄSKIE',
      'ŚWIĘTOKRZYSKIE',
      'WARMIŃSKO-MAZURSKIE',
      'WIELKOPOLSKIE',
      'ZACHODNIOPOMORSKIE',
    ],
    showOn: 'country:POLSKA',
  },
  {
    name: 'district',
    type: 'text',
    title: 'Powiat',
    required: true,
    showOn: 'country:POLSKA',
  },
  {
    name: 'commune',
    type: 'text',
    title: 'Gmina',
    required: true,
    showOn: 'country:POLSKA',
  },
  {
    name: 'town',
    type: 'text',
    title: 'Miejscowość',
    required: true,
  },
  {
    name: 'street',
    type: 'text',
    title: 'Ulica',
    required: false,
  },
  {
    name: 'houseNumber',
    type: 'text',
    title: 'Numer domu',
    required: true,
    showOn: 'country:POLSKA',
  },
  {
    name: 'houseNumber',
    type: 'text',
    title: 'Numer domu',
    required: false,
    vanishOn: 'country:POLSKA',
  },
  {
    name: 'apartmentNumber',
    type: 'text',
    title: 'Numer lokalu',
    required: false,
  },
  {
    name: 'zipCode',
    type: 'text',
    title: 'Kod pocztowy',
    required: true,
    showOn: 'country:POLSKA',
  },
  {
    name: 'zipCode',
    type: 'text',
    title: 'Kod pocztowy',
    required: false,
    vanishOn: 'country:POLSKA',
  },
];
