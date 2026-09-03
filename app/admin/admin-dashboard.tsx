'use client';

import type {
  ChangeEvent,
  ComponentProps,
  ReactNode,
  SyntheticEvent,
} from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  ImagePlus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/site-data';

type ProductRow = {
  id: number;
  name: string;
  category: string;
  price_cents: number;
  currency: string;
  period: string;
  image_url: string | null;
  stock: number;
  active: number;
};

type ClientRow = {
  id: number;
  username: string;
  display_name: string;
  phone: string | null;
  status: string;
  balance_cents: number;
  plan_name: string | null;
  valid_until: string | null;
  last_login_at: string | null;
};

type PaymentRow = {
  id: number;
  label: string;
  type: string;
  recipient: string | null;
  active: number;
};

type RechargeRow = {
  id: number;
  amount_cents: number;
  method: string;
  note: string | null;
  status: string;
  created_at: string;
  username: string;
  display_name: string;
};

type AdminData = {
  products: ProductRow[];
  clients: ClientRow[];
  paymentMethods: PaymentRow[];
  recharges: RechargeRow[];
};

type Credentials = { username: string; temporaryPassword: string };
type ActionResult = {
  error?: string;
  id?: number;
  ok?: boolean;
  username?: string;
  temporaryPassword?: string;
};
type ProductNotice = {
  tone: 'error' | 'success' | 'progress';
  message: string;
};
type ProductStage = 'idle' | 'uploading' | 'publishing';

const acceptedProductImages = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const maxProductImageBytes = 5 * 1024 * 1024;

const emptyData: AdminData = {
  products: [],
  clients: [],
  paymentMethods: [],
  recharges: [],
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      response.redirected
        ? 'Tu sesión venció. Vuelve a entrar al panel e inténtalo de nuevo.'
        : 'El servidor respondió de forma inesperada. Intenta nuevamente.',
    );
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [uploadedProductImage, setUploadedProductImage] = useState('');
  const [productNotice, setProductNotice] = useState<ProductNotice | null>(
    null,
  );
  const [productStage, setProductStage] = useState<ProductStage>('idle');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin', { cache: 'no-store' });
      const result = await readJsonResponse<AdminData & { error?: string }>(
        response,
      );
      if (!response.ok)
        throw new Error(result.error ?? 'No fue posible cargar los datos.');
      setData(result);
      setNotice('');
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar el panel.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(
    () => () => {
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    },
    [productImagePreview],
  );

  async function runAction(
    payload: Record<string, unknown>,
    onError?: (message: string) => void,
  ) {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await readJsonResponse<ActionResult>(response);
      if (!response.ok)
        throw new Error(result.error ?? 'No fue posible guardar el cambio.');
      void load();
      return result;
    } catch (error) {
      const message = errorMessage(error, 'No fue posible guardar el cambio.');
      setNotice(message);
      onError?.(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createClient(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await runAction({
      action: 'createClient',
      username: form.get('username'),
      password: form.get('password'),
      displayName: form.get('displayName'),
      phone: form.get('phone'),
      planName: form.get('planName'),
      validUntil: form.get('validUntil'),
      balanceCents: Math.round(Number(form.get('balance') || 0) * 100),
    });
    if (result?.username && result.temporaryPassword) {
      setCredentials({
        username: result.username,
        temporaryPassword: result.temporaryPassword,
      });
      setClientOpen(false);
    }
  }

  async function createProduct(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProductNotice(null);

    try {
      const externalImageUrl = form.get('imageUrl');
      let imageUrl =
        typeof externalImageUrl === 'string' ? externalImageUrl.trim() : '';

      if (productImageFile) {
        if (uploadedProductImage) {
          imageUrl = uploadedProductImage;
        } else {
          setProductStage('uploading');
          setProductNotice({
            tone: 'progress',
            message: 'Subiendo la foto desde tu dispositivo…',
          });
          const upload = new FormData();
          upload.set('file', productImageFile);
          const uploadResponse = await fetch('/api/admin/uploads', {
            method: 'POST',
            body: upload,
          });
          const uploadResult = await readJsonResponse<{
            error?: string;
            url?: string;
          }>(uploadResponse);
          if (!uploadResponse.ok || !uploadResult.url) {
            throw new Error(
              uploadResult.error ?? 'No fue posible subir la imagen.',
            );
          }
          imageUrl = uploadResult.url;
          setUploadedProductImage(imageUrl);
        }
      }

      setProductStage('publishing');
      setProductNotice({
        tone: 'progress',
        message: 'Guardando el plan en el catálogo…',
      });
      const result = await runAction(
        {
          action: 'createProduct',
          name: form.get('name'),
          category: form.get('category'),
          description: form.get('description'),
          priceCents: Math.round(Number(form.get('price')) * 100),
          currency: form.get('currency'),
          period: form.get('period'),
          badge: form.get('badge'),
          accent: form.get('accent'),
          imageUrl,
          stock: Number(form.get('stock')),
          sortOrder: Number(form.get('sortOrder') || 0),
        },
        (message) => setProductNotice({ tone: 'error', message }),
      );
      if (result) handleProductOpenChange(false);
    } catch (error) {
      const message = errorMessage(
        error,
        'No fue posible publicar el plan. Intenta nuevamente.',
      );
      setProductNotice({ tone: 'error', message });
    } finally {
      setProductStage('idle');
    }
  }

  function handleProductImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setProductNotice(null);
    setUploadedProductImage('');

    if (!file) {
      setProductImageFile(null);
      setProductImagePreview('');
      return;
    }
    if (!acceptedProductImages.has(file.type.toLowerCase())) {
      event.target.value = '';
      setProductImageFile(null);
      setProductImagePreview('');
      setProductNotice({
        tone: 'error',
        message: 'Selecciona una imagen JPG, PNG, WEBP o GIF.',
      });
      return;
    }
    if (file.size > maxProductImageBytes) {
      event.target.value = '';
      setProductImageFile(null);
      setProductImagePreview('');
      setProductNotice({
        tone: 'error',
        message: 'La imagen no puede superar 5 MB.',
      });
      return;
    }

    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
    setProductNotice({
      tone: 'success',
      message: 'Foto lista. Se subirá cuando pulses “Publicar plan”.',
    });
  }

  function clearProductImage() {
    setProductImageFile(null);
    setProductImagePreview('');
    setUploadedProductImage('');
    setProductNotice(null);
  }

  function handleProductOpenChange(open: boolean) {
    setProductOpen(open);
    if (!open) clearProductImage();
    if (open) setProductNotice(null);
  }

  async function deleteProduct(product: ProductRow) {
    const result = await runAction({
      action: 'deleteProduct',
      id: product.id,
    });
    if (result) {
      setData((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== product.id),
      }));
    }
  }

  async function createPayment(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await runAction({
      action: 'createPaymentMethod',
      label: form.get('label'),
      type: form.get('type'),
      instructions: form.get('instructions'),
      recipient: form.get('recipient'),
      imageUrl: form.get('imageUrl'),
      sortOrder: Number(form.get('sortOrder') || 0),
    });
    if (result) setPaymentOpen(false);
  }

  const pending = data.recharges.filter(
    (item) => item.status === 'pending',
  ).length;
  const activeProducts = data.products.filter((item) => item.active).length;

  return (
    <main className="min-h-screen bg-[#070707] text-foreground">
      <header className="border-b border-white/8 bg-black/70">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary font-black text-primary-foreground">
              V
            </span>
            <div>
              <p className="font-black">VENTAS VIP</p>
              <p className="text-xs font-black tracking-[0.16em] text-primary">
                ADMINISTRACIÓN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{adminName}</p>
              <p className="text-xs text-zinc-500">Administrador</p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-bold text-zinc-300 hover:bg-white/5"
              href="/"
              target="_blank"
            >
              <ExternalLink className="size-4" /> Ver tienda
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black tracking-[0.16em] text-primary">
              CENTRO DE CONTROL
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em]">
              Panel VIP
            </h1>
            <p className="mt-2 text-zinc-500">
              Gestiona accesos, catálogo, pagos y recargas.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={loading}
            className="rounded-full border-white/10 bg-white/5"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />{' '}
            Actualizar
          </Button>
        </div>

        {notice && (
          <div
            className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-bold text-red-300"
            role="alert"
          >
            {notice}
          </div>
        )}
        {credentials && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-emerald-300">
                Acceso creado — guárdalo ahora
              </p>
              <p className="mt-2 font-mono text-sm text-white">
                Usuario: {credentials.username} · Contraseña:{' '}
                {credentials.temporaryPassword}
              </p>
              <p className="mt-1 text-xs text-emerald-200/70">
                La contraseña no vuelve a mostrarse en el panel.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-emerald-400 font-black text-black hover:bg-emerald-300"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Usuario: ${credentials.username}\nContraseña: ${credentials.temporaryPassword}`,
                  )
                }
              >
                <Copy className="size-4" /> Copiar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCredentials(null)}
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: Users,
              label: 'Clientes',
              value: data.clients.length,
              help: 'Accesos creados',
            },
            {
              Icon: Package,
              label: 'Planes activos',
              value: activeProducts,
              help: 'Visibles en la tienda',
            },
            {
              Icon: CreditCard,
              label: 'Métodos',
              value: data.paymentMethods.length,
              help: 'Opciones de pago',
            },
            {
              Icon: WalletCards,
              label: 'Por revisar',
              value: pending,
              help: 'Recargas pendientes',
            },
          ].map(({ Icon, label, value, help }) => (
            <article
              key={label}
              className="rounded-3xl border border-white/8 bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-primary" />
                <span className="text-3xl font-black">{value}</span>
              </div>
              <p className="mt-5 font-black">{label}</p>
              <p className="mt-1 text-sm text-zinc-500">{help}</p>
            </article>
          ))}
        </div>

        <Tabs defaultValue="clients" className="mt-8">
          <TabsList
            className="h-auto w-full justify-start overflow-x-auto rounded-2xl bg-white/5 p-1.5 sm:w-fit"
            variant="default"
          >
            <TabsTrigger value="clients" className="min-h-10 px-4">
              <Users /> Clientes
            </TabsTrigger>
            <TabsTrigger value="catalog" className="min-h-10 px-4">
              <Package /> Catálogo
            </TabsTrigger>
            <TabsTrigger value="payments" className="min-h-10 px-4">
              <CreditCard /> Pagos
            </TabsTrigger>
            <TabsTrigger value="recharges" className="min-h-10 px-4">
              <WalletCards /> Recargas{' '}
              {pending > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
                  {pending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-5">
            <PanelHeader
              title="Usuarios y contraseñas"
              copy="Crea un acceso personal y asigna su plan."
              action={
                <Dialog open={clientOpen} onOpenChange={setClientOpen}>
                  <DialogTrigger
                    render={
                      <Button className="rounded-full bg-primary font-black text-primary-foreground hover:bg-amber-300" />
                    }
                  >
                    <Plus /> Crear usuario
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-card text-white sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuevo cliente</DialogTitle>
                      <DialogDescription>
                        Crea un usuario único. Si dejas la contraseña vacía,
                        generamos una segura.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      className="grid gap-4 sm:grid-cols-2"
                      onSubmit={createClient}
                    >
                      <Field
                        label="Nombre"
                        name="displayName"
                        placeholder="Nombre del cliente"
                        required
                      />
                      <Field
                        label="Usuario"
                        name="username"
                        placeholder="cliente.vip"
                        required
                      />
                      <Field
                        label="Contraseña inicial"
                        name="password"
                        type="password"
                        placeholder="Generar automáticamente"
                      />
                      <Field label="Teléfono" name="phone" placeholder="+57…" />
                      <Field
                        label="Plan asignado"
                        name="planName"
                        placeholder="Cine VIP"
                      />
                      <Field label="Vigencia" name="validUntil" type="date" />
                      <Field
                        label="Saldo inicial (COP)"
                        name="balance"
                        type="number"
                        placeholder="0"
                      />
                      <div className="self-end">
                        <Button
                          disabled={busy}
                          className="h-10 w-full bg-primary font-black text-primary-foreground hover:bg-amber-300"
                        >
                          {busy && <LoaderCircle className="animate-spin" />}{' '}
                          Crear acceso
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            />
            <DataBox
              loading={loading}
              empty={!data.clients.length}
              emptyText="Todavía no hay clientes. Crea el primer acceso."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <p className="font-bold">{client.display_name}</p>
                        <p className="text-xs text-zinc-500">
                          {client.phone || 'Sin teléfono'}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-primary">
                        {client.username}
                      </TableCell>
                      <TableCell>{client.plan_name || 'Sin asignar'}</TableCell>
                      <TableCell>
                        {client.valid_until || 'Por confirmar'}
                      </TableCell>
                      <TableCell>{formatMoney(client.balance_cents)}</TableCell>
                      <TableCell>
                        <Status value={client.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataBox>
          </TabsContent>

          <TabsContent value="catalog" className="mt-5">
            <PanelHeader
              title="Contenido disponible"
              copy="Publica los planes que aparecen en la tienda."
              action={
                <div className="flex flex-wrap gap-2">
                  {!data.products.length && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => runAction({ action: 'seedCatalog' })}
                      className="rounded-full border-white/10 bg-white/5"
                    >
                      <LayoutDashboard /> Cargar catálogo base
                    </Button>
                  )}
                  <Dialog
                    open={productOpen}
                    onOpenChange={handleProductOpenChange}
                  >
                    <DialogTrigger
                      render={
                        <Button className="rounded-full bg-primary font-black text-primary-foreground hover:bg-amber-300" />
                      }
                    >
                      <Plus /> Nuevo plan
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-card text-white sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Publicar plan</DialogTitle>
                        <DialogDescription>
                          Completa la información que verá el cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="grid gap-4 sm:grid-cols-2"
                        onSubmit={createProduct}
                      >
                        <Field
                          label="Nombre"
                          name="name"
                          placeholder="Cine VIP"
                          required
                        />
                        <Field
                          label="Categoría"
                          name="category"
                          placeholder="Películas"
                          required
                        />
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            name="description"
                            required
                            className="bg-white/5"
                            placeholder="Qué incluye el plan"
                          />
                        </div>
                        <Field
                          label="Precio"
                          name="price"
                          type="number"
                          placeholder="14900"
                          required
                        />
                        <Field
                          label="Moneda"
                          name="currency"
                          defaultValue="COP"
                          required
                        />
                        <Field
                          label="Duración"
                          name="period"
                          defaultValue="30 días"
                          required
                        />
                        <Field
                          label="Etiqueta"
                          name="badge"
                          defaultValue="Disponible"
                          required
                        />
                        <div className="space-y-2">
                          <Label htmlFor="accent">Color</Label>
                          <Select name="accent" defaultValue="gold">
                            <SelectTrigger className="h-10 w-full bg-white/5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gold">Dorado</SelectItem>
                              <SelectItem value="violet">Violeta</SelectItem>
                              <SelectItem value="blue">Azul</SelectItem>
                              <SelectItem value="emerald">Verde</SelectItem>
                              <SelectItem value="rose">Rosa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Field
                          label="Stock"
                          name="stock"
                          type="number"
                          defaultValue="1"
                          required
                        />
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="productImageFile">
                            Subir foto desde mi dispositivo
                          </Label>
                          <label
                            htmlFor="productImageFile"
                            className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 transition hover:border-primary/60 hover:bg-primary/10"
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                              <ImagePlus className="size-5" />
                            </span>
                            <span>
                              <strong className="block text-sm">
                                Elegir una foto
                              </strong>
                              <span className="mt-1 block text-xs text-zinc-500">
                                JPG, PNG, WEBP o GIF · máximo 5 MB
                              </span>
                            </span>
                            <Input
                              id="productImageFile"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleProductImage}
                              className="sr-only"
                            />
                          </label>
                          {productImageFile && productImagePreview && (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                              <Image
                                src={productImagePreview}
                                alt="Vista previa de la foto seleccionada"
                                className="size-16 rounded-xl object-cover"
                                width={64}
                                height={64}
                                unoptimized
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">
                                  {productImageFile.name}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {(
                                    productImageFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{' '}
                                  MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearProductImage}
                                disabled={productStage !== 'idle'}
                                className="text-zinc-300 hover:text-white"
                              >
                                <X className="size-4" /> Quitar
                              </Button>
                            </div>
                          )}
                        </div>
                        <Field
                          label="O pega una URL de imagen (opcional)"
                          name="imageUrl"
                          placeholder="https://…"
                        />
                        <Field
                          label="Orden"
                          name="sortOrder"
                          type="number"
                          defaultValue="0"
                        />
                        {productNotice && (
                          <div
                            className={`rounded-2xl border px-4 py-3 text-sm font-bold sm:col-span-2 ${
                              productNotice.tone === 'error'
                                ? 'border-red-400/20 bg-red-400/10 text-red-300'
                                : productNotice.tone === 'success'
                                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                  : 'border-primary/20 bg-primary/10 text-amber-200'
                            }`}
                            role={
                              productNotice.tone === 'error'
                                ? 'alert'
                                : 'status'
                            }
                            aria-live="polite"
                          >
                            {productNotice.message}
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <Button
                            type="submit"
                            disabled={busy || productStage !== 'idle'}
                            className="w-full bg-primary font-black text-primary-foreground hover:bg-amber-300"
                          >
                            {(busy || productStage !== 'idle') && (
                              <LoaderCircle className="animate-spin" />
                            )}{' '}
                            {productStage === 'uploading'
                              ? 'Subiendo foto…'
                              : productStage === 'publishing'
                                ? 'Publicando…'
                                : 'Publicar plan'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              }
            />
            <DataBox
              loading={loading}
              empty={!data.products.length}
              emptyText="Aún no hay planes guardados. Puedes cargar el catálogo base."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {product.category}
                        </p>
                      </TableCell>
                      <TableCell>
                        {formatMoney(product.price_cents, product.currency)}
                      </TableCell>
                      <TableCell>{product.period}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(product.active)}
                          onCheckedChange={(checked) =>
                            runAction({
                              action: 'toggleProduct',
                              id: product.id,
                              active: checked,
                            })
                          }
                          aria-label={`${product.active ? 'Ocultar' : 'Mostrar'} ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                className="text-red-300 hover:bg-red-400/10 hover:text-red-200"
                              />
                            }
                          >
                            <Trash2 className="size-4" /> Eliminar
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10 bg-card text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar “{product.name}”?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                El plan dejará de aparecer en la tienda y su
                                foto subida también se eliminará. Esta acción no
                                se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogCancel
                                variant="destructive"
                                onClick={() => void deleteProduct(product)}
                              >
                                <Trash2 className="size-4" /> Sí, eliminar
                              </AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataBox>
          </TabsContent>

          <TabsContent value="payments" className="mt-5">
            <PanelHeader
              title="Métodos de pago"
              copy="Añade las instrucciones y el QR que verá el cliente."
              action={
                <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                  <DialogTrigger
                    render={
                      <Button className="rounded-full bg-primary font-black text-primary-foreground hover:bg-amber-300" />
                    }
                  >
                    <Plus /> Nuevo método
                  </DialogTrigger>
                  <DialogContent className="border-white/10 bg-card text-white sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Agregar método</DialogTitle>
                      <DialogDescription>
                        Usa una URL HTTPS o el QR incluido:
                        /assets/pago-yape.png.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      className="grid gap-4 sm:grid-cols-2"
                      onSubmit={createPayment}
                    >
                      <Field
                        label="Nombre"
                        name="label"
                        placeholder="Yape"
                        required
                      />
                      <Field
                        label="Tipo"
                        name="type"
                        placeholder="QR"
                        required
                      />
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="instructions">Instrucciones</Label>
                        <Textarea
                          id="instructions"
                          name="instructions"
                          required
                          className="bg-white/5"
                          placeholder="Cómo debe pagar el cliente"
                        />
                      </div>
                      <Field
                        label="Titular"
                        name="recipient"
                        placeholder="Nombre del titular"
                      />
                      <Field
                        label="URL del QR"
                        name="imageUrl"
                        defaultValue="/assets/pago-yape.png"
                      />
                      <Field
                        label="Orden"
                        name="sortOrder"
                        type="number"
                        defaultValue="0"
                      />
                      <div className="self-end">
                        <Button
                          disabled={busy}
                          className="w-full bg-primary font-black text-primary-foreground hover:bg-amber-300"
                        >
                          Agregar método
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              }
            />
            <DataBox
              loading={loading}
              empty={!data.paymentMethods.length}
              emptyText="La tienda usa los métodos de muestra hasta que agregues uno."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Método</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-bold">
                        {method.label}
                      </TableCell>
                      <TableCell>{method.type}</TableCell>
                      <TableCell>{method.recipient || '—'}</TableCell>
                      <TableCell>
                        <Status value={method.active ? 'active' : 'inactive'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataBox>
          </TabsContent>

          <TabsContent value="recharges" className="mt-5">
            <PanelHeader
              title="Solicitudes de recarga"
              copy="Aprueba o rechaza las solicitudes registradas por clientes."
            />
            <DataBox
              loading={loading}
              empty={!data.recharges.length}
              emptyText="No hay solicitudes de recarga."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recharges.map((recharge) => (
                    <TableRow key={recharge.id}>
                      <TableCell>
                        <p className="font-bold">{recharge.display_name}</p>
                        <p className="text-xs text-zinc-500">
                          {recharge.username}
                        </p>
                      </TableCell>
                      <TableCell>
                        {formatMoney(recharge.amount_cents)}
                      </TableCell>
                      <TableCell>{recharge.method}</TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat('es-CO').format(
                          new Date(recharge.created_at),
                        )}
                      </TableCell>
                      <TableCell>
                        <Status value={recharge.status} />
                      </TableCell>
                      <TableCell>
                        {recharge.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="icon-sm"
                              className="bg-emerald-500 text-black hover:bg-emerald-400"
                              onClick={() =>
                                runAction({
                                  action: 'updateRecharge',
                                  id: recharge.id,
                                  status: 'approved',
                                })
                              }
                              aria-label="Aprobar"
                            >
                              <Check />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="destructive"
                              onClick={() =>
                                runAction({
                                  action: 'updateRecharge',
                                  id: recharge.id,
                                  status: 'rejected',
                                })
                              }
                              aria-label="Rechazar"
                            >
                              <X />
                            </Button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataBox>
          </TabsContent>
        </Tabs>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-zinc-400">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Las contraseñas se protegen con un hash derivado y nunca se muestran
            otra vez. Comparte el acceso inicial por un canal privado.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  ...props
}: { label: string; name: string; type?: string } & ComponentProps<
  typeof Input
>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        className="h-10 bg-white/5"
        {...props}
      />
    </div>
  );
}

function PanelHeader({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-3xl border border-white/8 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{copy}</p>
      </div>
      {action}
    </div>
  );
}

function DataBox({
  loading,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/8 bg-card">
      {loading ? (
        <div className="grid min-h-48 place-items-center">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </div>
      ) : empty ? (
        <div className="grid min-h-48 place-items-center px-5 text-center text-zinc-500">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function Status({ value }: { value: string }) {
  const approved = ['active', 'approved'].includes(value);
  const rejected = ['inactive', 'rejected', 'suspended'].includes(value);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${approved ? 'bg-emerald-400/10 text-emerald-400' : rejected ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-300'}`}
    >
      {approved ? 'Activo' : rejected ? 'Inactivo' : 'Pendiente'}
    </span>
  );
}
