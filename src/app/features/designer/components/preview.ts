import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '@openng/optimus-ui/button';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Textarea } from '@openng/optimus-ui/textarea';
import { Select } from '@openng/optimus-ui/select';
import { Checkbox } from '@openng/optimus-ui/checkbox';
import { RadioButton } from '@openng/optimus-ui/radiobutton';
import { ToggleSwitch } from '@openng/optimus-ui/toggleswitch';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { TableModule } from '@openng/optimus-ui/table';
import { Card } from '@openng/optimus-ui/card';
import { Fieldset } from '@openng/optimus-ui/fieldset';
import { Message } from '@openng/optimus-ui/message';
import { Tag } from '@openng/optimus-ui/tag';
import { Badge } from '@openng/optimus-ui/badge';
import { ProgressBar } from '@openng/optimus-ui/progressbar';
import { Chip } from '@openng/optimus-ui/chip';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';

@Component({
  selector: 'design-preview',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    Button,
    InputText,
    Textarea,
    Select,
    Checkbox,
    RadioButton,
    ToggleSwitch,
    InputNumber,
    TableModule,
    Card,
    Fieldset,
    Message,
    Tag,
    Badge,
    ProgressBar,
    Chip,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignPreview {
  protected readonly checked = signal(true);
  protected readonly switchValue = signal(true);
  protected readonly radioValue = signal('option1');
  protected readonly numberValue = signal(42);
  protected readonly inputValue = signal('Sample text');
  protected readonly textareaValue = signal('Multi-line\nsample text');
  protected readonly selectedCity = signal<string | null>(null);

  protected readonly cities = signal([
    { label: 'New York', value: 'ny' },
    { label: 'London', value: 'ldn' },
    { label: 'Paris', value: 'prs' },
    { label: 'Tokyo', value: 'tky' },
  ]);

  protected readonly tableData = signal([
    { name: 'Bamboo Watch', category: 'Accessories', price: 65 },
    { name: 'Black T-Shirt', category: 'Clothing', price: 29 },
    { name: 'Gaming Set', category: 'Electronics', price: 299 },
    { name: 'Gold Phone Case', category: 'Accessories', price: 24 },
    { name: 'Green Earbuds', category: 'Electronics', price: 89 },
  ]);

  protected readonly progressValue = signal(65);
}
