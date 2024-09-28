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
