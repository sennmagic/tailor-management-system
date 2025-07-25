"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/apiService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/components/ui/alertProvider";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Link from "next/link";

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className=" rounded  max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

function DynamicForm({ data, onSubmit, onCancel }: { data: Record<string, unknown>, onSubmit: (values: Record<string, unknown>) => void, onCancel: () => void }) {
  const [formState, setFormState] = useState<Record<string, unknown>>({ ...data });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCheckboxChange(name: string, checked: boolean) {
    setFormState((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function renderNestedObject(parentKey: string, value: Record<string, unknown>) {
    return (
      <div key={parentKey} className="flex flex-col border rounded p-2 mb-2 bg-gray-50">
        <label className="font-medium mb-1">{parentKey}</label>
        {Object.entries(value)
          .filter(([k]) => !SKIP_FIELDS.includes(k))
          .map(([subKey, subValue]) => {
            if (typeof subValue === "object" && subValue !== null && !Array.isArray(subValue)) {
              return renderNestedObject(subKey, subValue as Record<string, unknown>);
            }
            return (
              <div key={subKey} className="flex flex-col mb-1">
                <label className="text-xs mb-0.5">{subKey}</label>
                <Input
                  name={`${parentKey}.${subKey}`}
                  value={
                    subValue === null || subValue === undefined
                      ? ""
                      : typeof subValue === "object"
                        ? (Array.isArray(subValue) && subValue.length === 0) || (Object.keys(subValue).length === 0)
                          ? ""
                          : JSON.stringify(subValue)
                        : String(subValue)
                  }
                  onChange={e => {
                    setFormState(prev => ({
                      ...prev,
                      [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: e.target.value }
                    }));
                  }}
                  className="text-xs"
                />
              </div>
            );
          })}
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formState);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 flex flex-col h-[600px]">
      <h2 className="text-2xl font-bold mb-1">Edit Item <span className="text-gray-400 font-normal text-base">Update the details below</span></h2>
      <div className="flex-1 overflow-y-auto mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
          {Object.entries(formState)
            .filter(([key]) => !SKIP_FIELDS.includes(key))
            .map(([key, value]) => {
              const isCheckbox = key.toLowerCase() === "is" || key.toLowerCase().startsWith("is");
              let input;
              if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
                const subKeys = Object.keys(value[0] as Record<string, unknown>).filter((k) => k !== "_id");
                input = (
                  <div>
                    <table className="mb-2 w-full border text-xs">
                      <thead>
                        <tr>
                          {subKeys.map((subKey) => (
                            <th key={subKey} className="border px-2 py-1">{subKey}</th>
                          ))}
                          <th className="border px-2 py-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(value as Array<Record<string, unknown>>).map((item, idx) => (
                          <tr key={idx}>
                            {subKeys.map((subKey) => (
                              <td key={subKey} className="border px-2 py-1">
                                <Input
                                  value={
                                    item[subKey] === null || item[subKey] === undefined
                                      ? ""
                                      : typeof item[subKey] === "object"
                                        ? (Array.isArray(item[subKey]) && item[subKey].length === 0) || (Object.keys(item[subKey]).length === 0)
                                          ? ""
                                          : JSON.stringify(item[subKey])
                                        : String(item[subKey])
                                  }
                                  onChange={e => {
                                    const newArr = [...(value as Array<Record<string, unknown>>)]
                                    newArr[idx][subKey] = e.target.value;
                                    setFormState(prev => ({ ...prev, [key]: newArr }));
                                  }}
                                  className="text-xs"
                                />
                              </td>
                            ))}
                            <td className="border px-2 py-1">
                              <Button type="button" variant="outline" size="icon" onClick={() => {
                                const newArr = (value as Array<Record<string, unknown>>).filter((_, i) => i !== idx);
                                setFormState(prev => ({ ...prev, [key]: newArr }));
                              }}>
                                <span className="text-red-500">&times;</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Button type="button" size="sm" onClick={() => {
                      const newArr = [...(value as Array<Record<string, unknown>>), Object.fromEntries(subKeys.map(k => [k, ""]))];
                      setFormState(prev => ({ ...prev, [key]: newArr }));
                    }}>Add</Button>
                  </div>
                );
              } else if (isCheckbox) {
                input = (
                  <Checkbox
                    checked={!!value}
                    onCheckedChange={(checked) => handleCheckboxChange(key, !!checked)}
                    id={key}
                  />
                );
              } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                input = renderNestedObject(key, value as Record<string, unknown>);
              } else if (typeof value === "string") {
                input = <Input name={key} value={value} onChange={handleChange} type="text" />;
              } else if (typeof value === "number") {
                input = <Input name={key} value={value} onChange={handleChange} type="number" />;
              } else if (typeof value === "boolean") {
                input = (
                  <Checkbox
                    checked={value as boolean}
                    onCheckedChange={(checked) => handleCheckboxChange(key, !!checked)}
                    id={key}
                  />
                );
              } else {
                input = <Input name={key} value={JSON.stringify(value)} onChange={handleChange} type="text" />;
              }
              return (
                <div key={key} className="flex flex-col">
                  <label className="font-medium mb-1 text-sm text-gray-700" htmlFor={key}>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</label>
                  {input}
                </div>
              );
            })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-8 pt-4 border-t bg-white sticky bottom-0">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-blue-600 text-white">Save</Button>
      </div>
    </form>
  );
}

function extractDataArray(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === "object") return data as Array<Record<string, unknown>>;
    if (data.length > 0 && typeof data[0] !== "object") {
      return (data as unknown[]).map((item) => ({ value: item }));
    }
    return [];
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        return value as Array<Record<string, unknown>>;
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") {
        return value.map((item) => ({ value: item }));
      }
    }
  }
  return [];
}

const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];

export default function SlugPage() {
  const params = useParams();
  let slug = params.slug as string | undefined;
  if (Array.isArray(slug)) slug = slug[0];
  const [apiResponse, setApiResponse] = useState<Array<Record<string, unknown>>>([]);
  const { showAlert } = useAlert();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchAPI({ endpoint: slug, method: "GET" }).then(({ data, error }) => {
     
      const arr = extractDataArray(data);
      setApiResponse(arr);
      setError(error);
      setLoading(false);
    });
  }, [slug]);

  let allKeys: string[] = apiResponse[0] ? Object.keys(apiResponse[0]).slice(0, 4) : [];
  if (allKeys.length === 0 && apiResponse.length > 0) {
    allKeys = ["value"];
  }

  function renderCellValue(value: unknown) {
    if (value == null) return <span className="text-gray-400">-</span>;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object" && value && Object.keys(value).length === 0) {
      return <span className="text-gray-400">{'{}'}</span>;
    }
    return <span className="text-gray-400">-</span>;
  }

  function filterSubmitFields(values: Record<string, unknown>) {
    const filtered: Record<string, unknown> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!SKIP_FIELDS.includes(k)) filtered[k] = v;
    });
    return filtered;
  }

  async function handleEditSave(values: Record<string, unknown>) {
    const id = (values as Record<string, unknown>)._id as string | undefined;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
    const { error } = await fetchAPI({
      endpoint: `${endpointSlug}/${id}`,
      method: "PUT",
      data: filteredValues,
      withAuth: true,
    });
    if (error) {
      showAlert("Failed to update: " + error, "destructive");
    } else {
      fetchAPI({ endpoint: endpointSlug, method: "GET" }).then(({ data }) => {
        setApiResponse(extractDataArray(data));
      });
      setEditIdx(null);
      showAlert("Update successful!", "success");
    }
  }

  function handleDelete(idx: number) {
    setApiResponse((prev) => prev.filter((_, i) => i !== idx));
    setDeleteIdx(null);
    showAlert("Deleted successfully!", "success");
  }

  function getEmptyFormData() {
    if (apiResponse[0]) {
      const keys = Object.keys(apiResponse[0]).filter(
        (k) => !SKIP_FIELDS.includes(k)
      );
      const obj: Record<string, unknown> = {};
      keys.forEach((k) => {
        obj[k] = "";
      });
      return obj;
    }
    if (allKeys.length === 1 && allKeys[0] === "value") {
      return { value: "" };
    }
    return {};
  }

  async function handleAddSave(values: Record<string, unknown>) {
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
    const { error } = await fetchAPI({
      endpoint: endpointSlug,
      method: "POST",
      data: filteredValues,
      withAuth: true,
    });
    if (error) {
      showAlert("Failed to create: " + error, "destructive");
    } else {
      fetchAPI({ endpoint: endpointSlug, method: "GET" }).then(({ data }) => {
        setApiResponse(extractDataArray(data));
      });
      setAddOpen(false);
      showAlert("Created successfully!", "success");
    }
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {slug && (
            <BreadcrumbItem>
              <BreadcrumbPage>
                {slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Item'}</h1>
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setAddOpen(true)}
        >
          + Add {slug ?? 'Item'}
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : apiResponse.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No data found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {allKeys.map((key) => (
                  <TableHead key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiResponse.length > 0 && allKeys.length > 0 && Object.keys(apiResponse[0]).length === 0 ? (
                <TableRow>
                  {allKeys.map((key) => (
                    <TableCell key={key}>
                      <span className="text-gray-400">{'{}'}</span>
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ) : (
                apiResponse.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-blue-50 transition"
                  >
                    {allKeys.map((key) => (
                      <TableCell key={key}>{renderCellValue(row[key])}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setViewIdx(idx)}
                          className="bg-blue-500 text-white text-xs flex items-center gap-1"
                          title="View details"
                          size="icon"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditIdx(idx)}
                          className="bg-yellow-400 text-xs flex items-center gap-1"
                          title="Edit"
                          size="icon"
                        >
                          <MdEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteIdx(idx)}
                          className="bg-red-500 text-white text-xs flex items-center gap-1"
                          title="Delete"
                          size="icon"
                        >
                          <MdDelete className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <Modal open={viewIdx !== null} onClose={() => setViewIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Row Details</h2>
        <pre className="bg-gray-100 rounded p-4 text-xs overflow-x-auto max-h-96">
          {viewIdx !== null ? JSON.stringify(apiResponse[viewIdx], null, 2) : ""}
        </pre>
      </Modal>
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Edit Row</h2>
        {editIdx !== null && (
          <DynamicForm
            data={apiResponse[editIdx]}
            onSubmit={handleEditSave}
            onCancel={() => setEditIdx(null)}
          />
        )}
      </Modal>
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Are you sure you want to delete?</h2>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => handleDelete(deleteIdx as number)} className="bg-red-500 text-white">Yes, Delete</Button>
          <Button variant="outline" onClick={() => setDeleteIdx(null)}>Cancel</Button>
        </div>
      </Modal>
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Add New {slug ?? 'Item'}</h2>
        <DynamicForm
          data={getEmptyFormData()}
          onSubmit={handleAddSave}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  );
}