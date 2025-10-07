import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  NumberInput,
  NumberInputField,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stack,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  useToast,
  Spinner,
  Tooltip,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem,
  Tag,
  Heading,
  HStack,
  useColorMode,
  Switch,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import Card from '../Card/Card';
import CardHeader from '../Card/CardHeader';
import CardBody from '../Card/CardBody';
import { currencyAPI, transactionsAPI } from '../../services/api';
import {
  getSupportedCurrencies,
  getCurrencySymbol,
  formatCurrency,
  isValidCurrency,
} from '../../services/currencyService';

const STORAGE_KEY = 'currencyConverterPrefs';
const RATES_CACHE_KEY = (base) => `cc_rates_${base}`;

const CURRENCY_FLAG = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦',
  CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', KRW: '🇰🇷', SGD: '🇸🇬', HKD: '🇭🇰',
  NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴', MXN: '🇲🇽', BRL: '🇧🇷', RUB: '🇷🇺',
  ZAR: '🇿🇦', TRY: '🇹🇷'
};

const CurrencyConverter = () => {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const cardBg = useColorModeValue('white', 'navy.800');
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const borderCol = useColorModeValue('gray.100', 'whiteAlpha.200');
  const labelCol = useColorModeValue('gray.600', 'whiteAlpha.700');
  const gradientFrom = useColorModeValue('linear(120deg, rgba(99, 179, 237, 0.15), rgba(237, 100, 166, 0.12))', 'linear(120deg, rgba(99, 179, 237, 0.08), rgba(237, 100, 166, 0.08))');

  const [amount, setAmount] = useState('100');
  const [debouncedAmount, setDebouncedAmount] = useState('100');
  const [from, setFrom] = useState('INR');
  const [to, setTo] = useState('USD');
  const [favorites, setFavorites] = useState(['USD', 'EUR', 'INR']);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rates, setRates] = useState(null);
  const [trend, setTrend] = useState([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [offline, setOffline] = useState(false);

  const [isConverting, setIsConverting] = useState(false);
  const [isConvertingTx, setIsConvertingTx] = useState(false);

  const parsedAmount = useMemo(() => Number(debouncedAmount || 0), [debouncedAmount]);
  const supportedCurrencies = useMemo(() => getSupportedCurrencies(), []);

  const canConvert = !isLoadingRates && Number.isFinite(parsedAmount) && parsedAmount >= 0 && from && to;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof saved.amount === 'string') setAmount(saved.amount);
      if (typeof saved.amount === 'string') setDebouncedAmount(saved.amount);
      if (saved.from && isValidCurrency(saved.from)) setFrom(saved.from);
      if (saved.to && isValidCurrency(saved.to)) setTo(saved.to);
      if (Array.isArray(saved.selectedTargets)) setSelectedTargets(saved.selectedTargets.filter(isValidCurrency));
      if (typeof saved.tabIndex === 'number') setTabIndex(saved.tabIndex);
      if (Array.isArray(saved.favorites)) setFavorites(saved.favorites.filter(isValidCurrency));
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { amount, from, to, selectedTargets, tabIndex, favorites };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  }, [amount, from, to, selectedTargets, tabIndex, favorites]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 250);
    return () => clearTimeout(t);
  }, [amount]);

  const fetchRates = async (base) => {
    try {
      setIsLoadingRates(true);
      setOffline(false);
      const data = await currencyAPI.getRates(base);
      const payload = data?.data || data;
      setRates(payload);
      setLastUpdated(new Date());
      try { localStorage.setItem(RATES_CACHE_KEY(base), JSON.stringify({ payload, ts: Date.now() })); } catch {}
    } catch (err) {
      try {
        const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY(base)) || 'null');
        if (cached?.payload) {
          setRates(cached.payload);
          setLastUpdated(new Date(cached.ts));
          setOffline(true);
          toast({ title: 'Offline mode', description: 'Using last saved rates.', status: 'warning', duration: 2500 });
        } else {
          throw err;
        }
      } catch (e) {
        toast({ title: 'Failed to fetch rates', description: err.message || 'Please try again later.', status: 'error', duration: 3000, isClosable: true });
      }
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchRates(from);
  }, [from]);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        if (!from || !to) { setTrend([]); return; }
        setIsLoadingTrend(true);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const startStr = start.toISOString().slice(0,10);
        const endStr = end.toISOString().slice(0,10);
        const url = `https://api.exchangerate.host/timeseries?base=${from}&symbols=${to}&start_date=${startStr}&end_date=${endStr}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Trend fetch failed');
        const json = await res.json();
        const series = Object.keys(json.rates || {}).sort().map((d) => json.rates[d]?.[to]).filter(Boolean);
        setTrend(series);
      } catch {
        setTrend([]);
      } finally {
        setIsLoadingTrend(false);
      }
    };
    fetchTrend();
  }, [from, to]);

  const refreshRates = () => fetchRates(from);

  const swapCurrencies = () => { setFrom(to); setTo(from); };

  const handleConvert = async () => {
    if (!canConvert) return;
    try {
      setIsConverting(true);
      const payload = { amount: parsedAmount, fromCurrency: from, toCurrency: to };
      const data = await currencyAPI.convert(payload);
      const converted = data?.convertedAmount ?? data?.data?.convertedAmount ?? parsedAmount;
      toast({ title: 'Conversion complete', description: `${formatCurrency(parsedAmount, from)} = ${formatCurrency(converted, to)}`, status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Conversion failed', description: err.message || 'Please try again.', status: 'error', duration: 3000, isClosable: true });
    } finally { setIsConverting(false); }
  };

  const pasteAmount = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const n = parseFloat(text.replace(/[^\d.\-]/g, ''));
      if (!Number.isNaN(n)) setAmount(String(n));
      else toast({ title: 'Clipboard has no number', status: 'info', duration: 2000 });
    } catch {
      toast({ title: 'Clipboard read blocked', description: 'Paste manually (Ctrl/Cmd+V).', status: 'warning', duration: 2500 });
    }
  };

  const handleConvertTransactions = async () => {
    try {
      setIsConvertingTx(true);
      await transactionsAPI.getAll({ page: 1, limit: 1 });
      await currencyAPI.convertTransactions(to);
      toast({ title: 'Transactions converted', description: `All transactions converted to ${to}.`, status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({ title: 'Failed to convert transactions', description: err.message || 'Please try again.', status: 'error', duration: 3000, isClosable: true });
    } finally { setIsConvertingTx(false); }
  };

  const livePreview = useMemo(() => {
    if (!rates?.rates || !canConvert) return null;
    const rate = rates.rates[to];
    if (!rate) return null;
    const value = parsedAmount * rate;
    return { rate, value, pretty: `${formatCurrency(parsedAmount, from)} → ${formatCurrency(value, to)}` };
  }, [rates, parsedAmount, from, to, canConvert]);

  const multiResults = useMemo(() => {
    if (!rates?.rates || !selectedTargets?.length || !Number.isFinite(parsedAmount)) return [];
    return selectedTargets.map((t) => ({ code: t, rate: rates.rates[t], value: rates.rates[t] ? parsedAmount * rates.rates[t] : null }))
      .filter((r) => r.rate);
  }, [rates, selectedTargets, parsedAmount]);

  const favoriteChips = useMemo(() => {
    if (!rates?.rates) return [];
    return favorites.filter((c) => c !== from && rates.rates[c]).map((c) => ({ code: c, rate: rates.rates[c] }));
  }, [favorites, rates, from]);

  const commonChips = useMemo(() => {
    if (!rates?.rates) return [];
    const common = ['USD','EUR','GBP','JPY','AUD','CAD'];
    return common.filter((c) => c !== from && rates.rates[c]).map((c) => ({ code: c, rate: rates.rates[c] }));
  }, [rates, from]);

  const toggleFavorite = (code) => {
    setFavorites((curr) => (curr.includes(code) ? curr.filter((c) => c !== code) : [...curr, code]));
  };

  const FlagLabel = ({ code }) => (
    <HStack spacing={2}>
      <Text as="span">{CURRENCY_FLAG[code] || '🏳️'}</Text>
      <Text as="span">{code}</Text>
    </HStack>
  );

  const Sparkline = ({ data = [], color = '#3182CE' }) => {
    if (!data.length) return null;
    const w = 120, h = 36, min = Math.min(...data), max = Math.max(...data);
    const scaleX = (i) => (i / (data.length - 1)) * (w - 2) + 1;
    const scaleY = (v) => h - ((v - min) / (max - min || 1)) * (h - 2) - 1;
    const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
    const last = data[data.length - 1];
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path d={d} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={scaleX(data.length - 1)} cy={scaleY(last)} r="2.5" fill={color} />
      </svg>
    );
  };

  return (
    <Box w="100%" position="relative" overflow="hidden" borderRadius="2xl" _before={{ content: '""', position: 'absolute', inset: 0, bgGradient: gradientFrom, opacity: 1 }} fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">
      <Card bg={cardBg} border="1px solid" borderColor={borderCol} borderRadius="xl" boxShadow={{ base: 'sm', md: 'xl' }}>
        <CardHeader px={{ base: 4, md: 6 }} py={{ base: 4, md: 5 }}>
          <Stack direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4}>
            <Stack spacing={0}>
              <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">Currency Converter</Text>
              <Text fontSize="sm" color={labelCol}>Convert any amount instantly with live rates</Text>
            </Stack>
            <HStack spacing={3}>
              {offline ? <Badge colorScheme="yellow" borderRadius="full">Offline</Badge> : <Badge colorScheme="blue" borderRadius="full">Live Rates</Badge>}
              <Tooltip label="Refresh rates">
                <IconButton aria-label="Refresh rates" icon={<RepeatIcon />} size="sm" onClick={refreshRates} />
              </Tooltip>
              <HStack spacing={2}>
                <Text fontSize="xs" color={labelCol}>Dark mode</Text>
                <Switch isChecked={colorMode === 'dark'} onChange={toggleColorMode} size="sm" />
              </HStack>
            </HStack>
          </Stack>
        </CardHeader>

        <Divider />

        <CardBody px={{ base: 4, md: 6 }} py={{ base: 5, md: 6 }}>
          <Tabs colorScheme="blue" isFitted index={tabIndex} onChange={setTabIndex} variant="soft-rounded">
            <TabList>
              <Tab>Single</Tab>
              <Tab>Multiple</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 12 }} gap={4}>
                  <Box as={Stack} gridColumn={{ md: 'span 4' }} spacing={3}>
                    <FormControl>
                      <FormLabel>Amount</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Text color="gray.500">{getCurrencySymbol(from)}</Text>
                        </InputLeftElement>
                        <NumberInput value={amount} onChange={(v) => setAmount(v)} min={0} precision={2} w="100%">
                          <NumberInputField placeholder="Enter amount" />
                        </NumberInput>
                      </InputGroup>
                    </FormControl>

                    <HStack spacing={2} wrap="wrap">
                      {['100', '500', '1000'].map((n) => (
                        <Button key={n} size="sm" variant="outline" onClick={() => setAmount(n)}>+{n}</Button>
                      ))}
                      <Button size="sm" variant="ghost" onClick={pasteAmount}>Paste</Button>
                    </HStack>
                  </Box>

                  <Stack direction={{ base: 'column', md: 'row' }} align="center" gridColumn={{ md: 'span 8' }} spacing={3}>
                    <FormControl flex="1">
                      <FormLabel>From</FormLabel>
                      <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                        {supportedCurrencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {CURRENCY_FLAG[c.code] || '🏳️'} {c.code} — {c.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <Box pt={{ base: 1, md: 6 }}>
                      <Tooltip label="Swap currencies">
                        <IconButton aria-label="Swap currencies" icon={<RepeatIcon />} onClick={swapCurrencies} variant="outline" borderRadius="full" />
                      </Tooltip>
                    </Box>

                    <FormControl flex="1">
                      <FormLabel>To</FormLabel>
                      <Select value={to} onChange={(e) => setTo(e.target.value)}>
                        {supportedCurrencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {CURRENCY_FLAG[c.code] || '🏳️'} {c.code} — {c.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </SimpleGrid>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={3} mt={5}>
                  <Button colorScheme="blue" onClick={handleConvert} isDisabled={!canConvert} isLoading={isConverting}>
                    Convert
                  </Button>
                  <Box flex="1" />
                  <Tooltip label="Convert and persist amounts across all transactions to the target currency">
                    <Button variant="ghost" colorScheme="purple" onClick={handleConvertTransactions} isLoading={isConvertingTx}>
                      Convert Expenses to {to}
                    </Button>
                  </Tooltip>
                </Stack>

                <Box mt={6} p={5} bg={subtleBg} border="1px solid" borderColor={borderCol} borderRadius="lg">
                  {isLoadingRates ? (
                    <Stack direction="row" align="center" spacing={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color={labelCol}>Fetching live rates for {from}…</Text>
                    </Stack>
                  ) : livePreview ? (
                    <Stack spacing={1}>
                      <Heading size="md">{livePreview.pretty}</Heading>
                      <Text fontSize="sm" color={labelCol}>1 {from} = {livePreview.rate} {to}{lastUpdated ? ` • Updated ${new Date(lastUpdated).toLocaleTimeString()}` : ''}</Text>
                      {isLoadingTrend ? <Spinner size="xs" /> : <Sparkline data={trend} color="#805AD5" />}
                    </Stack>
                  ) : null}
                </Box>

                {(favoriteChips.length || commonChips.length) ? (
                  <Box mt={5}>
                    <Text fontWeight="semibold" mb={2}>Real-time exchange rates</Text>
                    <Wrap spacing={2}>
                      {[...favoriteChips, ...commonChips].map((r) => (
                        <WrapItem key={`chip-${r.code}`}>
                          <Tag size="lg" variant="subtle" colorScheme="blue" cursor="pointer" onClick={() => setTo(r.code)}>
                            {CURRENCY_FLAG[r.code] || '🏳️'} {r.code}: {r.rate}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                ) : null}

                <HStack mt={3} spacing={2} wrap="wrap">
                  <Text fontSize="xs" color={labelCol}>Favorites:</Text>
                  {['USD','EUR','GBP','JPY','INR','AUD'].map((c) => (
                    <Button key={c} size="xs" variant={favorites.includes(c) ? 'solid' : 'outline'} colorScheme="blue" onClick={() => toggleFavorite(c)}>
                      {CURRENCY_FLAG[c] || '🏳️'} {c}
                    </Button>
                  ))}
                </HStack>
              </TabPanel>

              <TabPanel px={0}>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>Select target currencies</FormLabel>
                    <CheckboxGroup value={selectedTargets} onChange={setSelectedTargets}>
                      <Wrap>
                        {supportedCurrencies.filter((c) => c.code !== from).map((c) => (
                          <WrapItem key={c.code}>
                            <Tag as="label" size="lg" variant="outline" p={2} borderRadius="md" cursor="pointer">
                              <Checkbox value={c.code} mr={2} />
                              {CURRENCY_FLAG[c.code] || '🏳️'} {c.code}
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </CheckboxGroup>
                  </FormControl>

                  <Box p={4} bg={subtleBg} border="1px solid" borderColor={borderCol} borderRadius="md">
                    {multiResults.length ? (
                      <Wrap spacing={3}>
                        {multiResults.map((r) => (
                          <WrapItem key={r.code}>
                            <Tag size="lg" colorScheme="blue" variant="subtle">
                              {formatCurrency(parsedAmount, from)} → {formatCurrency(r.value, r.code)}
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : (
                      <Text fontSize="sm" color={labelCol}>Pick one or more currencies to see multiple conversions at once.</Text>
                    )}
                  </Box>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  );
};

export default CurrencyConverter;
