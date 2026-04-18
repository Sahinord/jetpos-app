# JetPOS RAW Printer Helper - Windows Spooler API (winspool.drv)
# Kullanım: powershell -ExecutionPolicy Bypass -File rawprint.ps1 -PrinterName "Rongta" -FilePath "C:\temp\data.bin"
param(
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [Parameter(Mandatory=$true)][string]$FilePath
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DOCINFOW {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDatatype;
    }

    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOCINFOW pDocInfo);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    public static bool SendBytesToPrinter(string printerName, byte[] bytes) {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;

        var di = new DOCINFOW();
        di.pDocName = "JetPOS RAW Print";
        di.pDatatype = "RAW";

        if (!StartDocPrinter(hPrinter, 1, ref di)) { ClosePrinter(hPrinter); return false; }
        if (!StartPagePrinter(hPrinter)) { EndDocPrinter(hPrinter); ClosePrinter(hPrinter); return false; }

        IntPtr pBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pBytes, bytes.Length);
        int written;
        bool ok = WritePrinter(hPrinter, pBytes, bytes.Length, out written);
        Marshal.FreeCoTaskMem(pBytes);

        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);
        return ok && (written == bytes.Length);
    }
}
"@

if (-not (Test-Path $FilePath)) {
    Write-Error "Dosya bulunamadi: $FilePath"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$result = [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes)

if ($result) {
    Write-Output "OK"
    exit 0
} else {
    Write-Error "Yaziciya gonderilemedi: $PrinterName"
    exit 1
}
