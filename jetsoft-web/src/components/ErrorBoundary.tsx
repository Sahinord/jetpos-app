import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#020817', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>Ups! Bir hata oluştu.</h1>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Görünüşe göre bileşenlerden biri render edilemedi:</p>
          <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <p style={{ marginTop: '20px' }}>Eğer <b>"Module not found"</b> diyorsa lütfen terminalde <code>npm install</code> komutunu tekrar çalıştırın.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
