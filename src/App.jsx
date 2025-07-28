import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setLogLevel, writeBatch, query, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

// --- Helper Functions & Configuration ---
// This now securely reads the Firebase config from your local .env.local file
// or from the deployment environment's variables on Vercel.
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG || (typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const firebaseConfig = JSON.parse(firebaseConfigString);


const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
setLogLevel('debug');

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const authSignIn = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication Error:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
            setIsAuthReady(true);
        });

        authSignIn();
        return () => unsubscribe();
    }, []);

    const renderPage = () => {
        if (!isAuthReady) {
            return <LoadingSpinner />;
        }
        switch (page) {
            case 'home':
                return <HomePage setPage={setPage} />;
            case 'gallery':
                return <GalleryPage />;
            case 'components':
                return <ComponentsPage userId={userId} />;
            case 'about':
                return <AboutPage />;
            default:
                return <HomePage setPage={setPage} />;
        }
    };

    return (
        <div className="bg-black text-gray-200 min-h-screen font-sans">
            <Navbar setPage={setPage} />
            <main className="p-4 md:p-8">
                {renderPage()}
            </main>
            <Footer />
        </div>
    );
}

// --- Navigation Component ---
const Navbar = ({ setPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navLinks = ['home', 'gallery', 'components', 'about'];

    return (
        <nav className="bg-neutral-900/70 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button onClick={() => setPage('home')} className="flex-shrink-0 text-white text-2xl font-bold tracking-wider">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                           SIDEWINDER
                        </button>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map(link => (
                                <button key={link} onClick={() => setPage(link)} className="text-gray-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium uppercase transition-colors duration-300">
                                    {link}
                                </button>
                            ))}
                            <a href="https://phoenix-bphc.vercel.app/thriveforce" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium uppercase transition-colors duration-300">
                                Thriveforce
                            </a>
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} type="button" className="bg-neutral-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white">
                            <span className="sr-only">Open main menu</span>
                            <svg className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map(link => (
                        <button key={link} onClick={() => { setPage(link); setIsOpen(false); }} className="text-gray-300 hover:bg-neutral-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left uppercase">
                            {link}
                        </button>
                    ))}
                    <a href="https://phoenix-bphc.vercel.app/thriveforce" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:bg-neutral-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left uppercase">
                        Thriveforce
                    </a>
                </div>
            </div>
        </nav>
    );
};

// --- Page Components ---

const HomePage = ({ setPage }) => (
    <div>
        <header className="relative text-white text-center py-20 md:py-40 rounded-lg overflow-hidden bg-black">
             <div className="absolute inset-0 bg-cover bg-center z-0" style={{backgroundImage: "url('https://placehold.co/1200x600/000000/92400E?text=Sidewinder+In+Action')", opacity: 0.3}}></div>
             <div className="relative z-10 max-w-4xl mx-auto px-4">
                <h1 className="text-4xl md:text-7xl font-extrabold mb-4 text-orange-500 drop-shadow-lg tracking-wider">SIDEWINDER</h1>
                <p className="text-lg md:text-2xl mb-8 font-light text-amber-100">3lb Beetleweight Combat Robot. Engineered to Dominate.</p>
                <div className="space-x-4">
                    <button onClick={() => setPage('gallery')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-orange-900/50 border-b-4 border-orange-800 hover:border-orange-900">View Gallery</button>
                    <button onClick={() => setPage('components')} className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg">Bot Components</button>
                </div>
            </div>
        </header>

        <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">THE MACHINE</h2>
                    <p className="mt-4 text-lg text-gray-400">A fusion of destructive power and resilient design.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        title="Undercutter"
                        description="A high-RPM, hardened S7 tool steel weapon designed for maximum impact and armor penetration."
                    />
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22a12.02 12.02 0 009-1.056c.343-.334.652-.69.923-1.078z" /></svg>}
                        title="Fighter"
                        description="Only bot in Thriveforce to defeat bullfrog.....
                        Won it's debut match dominantly"
                    />
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M12 21v-2.5M4 7l2 1M4 7l2-1M4 7v2.5m16 4l-2-1m2 1l-2 1m2-1v2.5M12 3v2.5" /></svg>}
                        title="Brushless Drive"
                        description="Powerful brushless motors deliver rapid acceleration and agile maneuverability inside the arena."
                    />
                </div>
            </div>
        </section>

        <section className="bg-neutral-900/60 py-16 md:py-24 border-y border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">MEET THE TEAM</h2>
                    <p className="mt-4 text-lg text-gray-400">The minds behind the mayhem.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    {/* To add your own images, place them in the `public/images` folder
                        and update the `imgSrc` path below to match your filename. */}
                    <TeamMemberCard
                        imgSrc="/images/Keshav.png"
                        name="Keshav Krishnan"
                        role="Founder"
                    />
                    <TeamMemberCard
                        imgSrc="/images/manoj.png"
                        name="Badam Naga Manoj"
                        role="Hard Worker"
                    />
                    <TeamMemberCard
                        imgSrc="/images/ekansh.png"
                        name="Ekansh Goel"
                        role="Moral Support"
                    />
                </div>
            </div>
        </section>
    </div>
);

const GalleryPage = () => {
    // This gallery is now persistent and loads images from your project folder.
    // To add your own images:
    // 1. Place your image files in the `public/images/` directory.
    // 2. Add a new entry to the `galleryImages` array below with the correct `src` path.
    const galleryImages = [
        { id: 1, src: '/images/p1.png', alt: '' },
        { id: 2, src: '/images/p2.png', alt: '' },
        { id: 3, src: '/images/p3.png', alt: '' },
        { id: 4, src: '/images/sdOriginal.jpg', alt: '' },
        { id: 5, src: '/images/sdPre-matchBPGC.jpg', alt: '' },
        { id: 6, src: '/images/sdPost-match-BPGC.jpg', alt: '' },
        { id: 7, src: '/images/p4.png', alt: '' },
        { id: 8, src: '/images/sd1.png', alt: '' },
        { id: 9, src: '/images/sd2.png', alt: '' },
        // Add more images here, for example:
        // { id: 10, src: '/images/my-new-photo.jpg', alt: 'A description of my new photo' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageHeader title="Gallery" subtitle="A curated collection of photos from the workshop and the arena." />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryImages.map((image) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-lg border-2 border-neutral-800 hover:border-orange-600 transition-colors duration-300 bg-black/20 flex items-center justify-center">
                        <img 
                            src={image.src} 
                            alt={image.alt} 
                            className="w-full h-64 object-contain transform group-hover:scale-110 transition-transform duration-500" 
                            // Add a fallback for when an image is not found in the public folder
                            onError={(e) => {
                                e.currentTarget.src = `https://placehold.co/600x400/171717/9A3412?text=Image+Not+Found`;
                                e.currentTarget.onerror = null; 
                            }}
                        />
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-sm font-semibold">{image.alt}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ComponentsPage = ({ userId }) => {
    const [builds, setBuilds] = useState([]);
    const [selectedBuildId, setSelectedBuildId] = useState(null);
    const [newComponent, setNewComponent] = useState({ id: '', name: '', quantity: '', price: '' });
    const [editingComponent, setEditingComponent] = useState(null);
    const [newEventName, setNewEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const buildsCollectionPath = `artifacts/${appId}/users/${userId}/builds`;

    useEffect(() => {
        if (!userId) return;

        const q = collection(db, buildsCollectionPath);
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.empty) {
                // If no builds exist, create the default "Current Build"
                try {
                    const docRef = await addDoc(collection(db, buildsCollectionPath), {
                        name: "Current Build",
                        isDefault: true,
                        createdAt: new Date(),
                        components: []
                    });
                    setSelectedBuildId(docRef.id);
                    setBuilds([{ id: docRef.id, name: "Current Build", isDefault: true, components: [] }]);
                } catch (err) {
                    console.error("Error creating default build:", err);
                    setError("Failed to initialize component database.");
                }
                setLoading(false);
            } else {
                const buildsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                buildsData.sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name)));
                setBuilds(buildsData);

                if (!selectedBuildId || !buildsData.some(b => b.id === selectedBuildId)) {
                    const defaultBuild = buildsData.find(b => b.isDefault) || buildsData[0];
                    setSelectedBuildId(defaultBuild.id);
                }
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching builds:", err);
            setError("Failed to load component data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEventName.trim()) {
            setError("Event name cannot be empty.");
            return;
        }
        try {
            await addDoc(collection(db, buildsCollectionPath), {
                name: newEventName,
                isDefault: false,
                createdAt: new Date(),
                components: []
            });
            setNewEventName('');
            setError('');
        } catch (err) {
            console.error("Error adding event:", err);
            setError("Failed to add new event build.");
        }
    };

    const handleAddOrUpdateComponent = async (e) => {
        e.preventDefault();
        const componentData = editingComponent || newComponent;

        if (!componentData.name || !componentData.quantity || isNaN(parseFloat(componentData.price)) || isNaN(parseInt(componentData.quantity))) {
            setError("Please fill all fields with valid data.");
            return;
        }

        const buildDocRef = doc(db, buildsCollectionPath, selectedBuildId);
        const selectedBuild = builds.find(b => b.id === selectedBuildId);
        let updatedComponents = [...selectedBuild.components];

        if (editingComponent) {
            // Update existing component
            updatedComponents = updatedComponents.map(c => c.id === editingComponent.id ? { ...editingComponent } : c);
        } else {
            // Add new component
            updatedComponents.push({ ...newComponent, id: crypto.randomUUID() });
        }

        try {
            await updateDoc(buildDocRef, { components: updatedComponents });
            setNewComponent({ id: '', name: '', quantity: '', price: '' });
            setEditingComponent(null);
            setError('');
        } catch (err) {
            console.error("Firestore error:", err);
            setError("Failed to save component.");
        }
    };

    const handleDeleteComponent = async (componentId) => {
         if (!window.confirm("Are you sure you want to delete this component?")) return;
        const buildDocRef = doc(db, buildsCollectionPath, selectedBuildId);
        const selectedBuild = builds.find(b => b.id === selectedBuildId);
        const updatedComponents = selectedBuild.components.filter(c => c.id !== componentId);

        try {
            await updateDoc(buildDocRef, { components: updatedComponents });
        } catch (err) {
            console.error("Delete error:", err);
            setError("Failed to delete component.");
        }
    };
    
    const handleInputChange = (e, setter) => {
        const { name, value } = e.target;
        setter(prev => ({ ...prev, [name]: value }));
    };

    const selectedBuild = builds.find(b => b.id === selectedBuildId);
    const totalCost = selectedBuild?.components.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) || 0;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageHeader title="Component Database" subtitle="Tracking parts and costs for the current build and past events." />

            {/* Event Creation Form */}
            <div className="bg-neutral-800 p-4 rounded-lg shadow-xl mb-8 border border-neutral-700">
                <form onSubmit={handleAddEvent} className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="newEventName" className="block text-sm font-medium text-gray-300">New Event Name</label>
                        <input
                            type="text"
                            id="newEventName"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            placeholder="e.g., RoboWarz 2025"
                            className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 h-10">Add Event</button>
                </form>
            </div>
            
            {/* Build Selection Tabs */}
            <div className="mb-8">
                <div className="border-b border-neutral-700">
                    <nav className="-mb-px flex gap-4" aria-label="Tabs">
                        {builds.map((build) => (
                            <button
                                key={build.id}
                                onClick={() => setSelectedBuildId(build.id)}
                                className={`${
                                    build.id === selectedBuildId
                                        ? 'border-orange-500 text-orange-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {build.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {selectedBuild ? (
                <div>
                    {/* Component Add/Edit Form */}
                    <div className="bg-neutral-800 p-6 rounded-lg shadow-xl mb-8 border border-neutral-700">
                        <h3 className="text-xl font-bold text-white mb-4">{editingComponent ? 'Edit Component' : 'Add New Component'}</h3>
                        <form onSubmit={handleAddOrUpdateComponent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Component Name</label>
                                <input type="text" name="name" id="name" value={editingComponent?.name || newComponent.name} onChange={e => handleInputChange(e, editingComponent ? setEditingComponent : setNewComponent)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-300">Number of Items</label>
                                <input type="number" name="quantity" id="quantity" value={editingComponent?.quantity || newComponent.quantity} onChange={e => handleInputChange(e, editingComponent ? setEditingComponent : setNewComponent)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-300">Price (₹)</label>
                                <input type="number" step="0.01" name="price" id="price" value={editingComponent?.price || newComponent.price} onChange={e => handleInputChange(e, editingComponent ? setEditingComponent : setNewComponent)} className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div className="md:col-span-4 flex gap-4">
                                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-lg">{editingComponent ? 'Update' : 'Add Component'}</button>
                                {editingComponent && <button type="button" onClick={() => { setEditingComponent(null); setNewComponent({ name: '', quantity: '', price: '' }); }} className="flex-1 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Cancel</button>}
                            </div>
                        </form>
                        {error && <p className="mt-4 text-red-500">{error}</p>}
                    </div>

                    {/* Components Table */}
                    <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden border border-neutral-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-700">
                                <thead className="bg-neutral-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Items</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price (₹)</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-neutral-800 divide-y divide-neutral-700">
                                    {selectedBuild.components.map((component) => (
                                        <tr key={component.id} className="hover:bg-neutral-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{component.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{component.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₹{parseFloat(component.price).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => setEditingComponent(component)} className="text-orange-400 hover:text-orange-300">Edit</button>
                                                <button onClick={() => handleDeleteComponent(component.id)} className="text-red-500 hover:text-red-400">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-neutral-700/50">
                                    <tr>
                                        <td colSpan="2" className="px-6 py-3 text-right text-sm font-medium text-gray-300 uppercase">Total Cost:</td>
                                        <td colSpan="2" className="px-6 py-3 text-left text-sm font-bold text-white">₹{totalCost.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-400">Select a build or create an event to get started.</p>
            )}
        </div>
    );
};


const AboutPage = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="About Sidewinder" subtitle="The story, the strategy, the engineering." />
        <div className="bg-neutral-800 p-8 rounded-lg shadow-xl space-y-6 text-gray-300 leading-relaxed border border-neutral-700">
            <p>Sidewinder was born from a passion for robotic combat and a drive to create a machine that is both elegant in its simplicity and brutal in its effectiveness. The design philosophy centers around a powerful, reliable weapon system coupled with a durable, low-profile chassis that can withstand the rigors of the modern combat robotics arena.</p>
            <img src= "images/electronics.jpg" alt="Sidewinder schematics" className="rounded-lg shadow-md" />
            <h3 className="text-2xl font-bold text-white pt-4">Design Philosophy</h3>
            <p>Our primary goal is complete dominance. Sidewinder is designed to be invertible, aggressive, and incredibly sturdy. Every component, from the custom-machined weapon bar to the shock-mounted electronics, has been selected and integrated to contribute to a single purpose: victory.</p>
            <h3 className="text-2xl font-bold text-white pt-4">Competition History</h3>
            <p>Sidewinder is currently gearing up for its debut season. We are actively testing and refining the design based on scrimmage performance and stress analysis. Follow our journey on the gallery page and watch for updates as we enter our first major tournament.</p>
            
            <div className="border-t border-neutral-700 pt-6">
                <h3 className="text-2xl font-bold text-white">Contact Us</h3>
                <p className="mt-2">Have questions or want to talk about sponsorships? Reach out to us!</p>
                <p className="mt-4">
                    <a href="mailto:krishnankeshav007@gmail.com" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                        Email the Team
                    </a>
                </p>
            </div>
        </div>
    </div>
);

// --- Reusable UI Components ---

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-neutral-800 p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300 border border-neutral-700 hover:border-orange-600">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-600 text-white mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="mt-2 text-base text-gray-400">{description}</p>
    </div>
);

const TeamMemberCard = ({ imgSrc, name, role }) => (
    <div className="text-center text-gray-300">
        <img 
            className="mx-auto h-40 w-40 rounded-full object-cover border-4 border-neutral-700" 
            src={imgSrc} 
            alt={`Photo of ${name}`} 
            onError={(e) => {
                e.currentTarget.src = `https://placehold.co/400x400/171717/D97706?text=${name.split(' ')[0]}`;
                e.currentTarget.onerror = null; 
            }}
        />
        <h3 className="mt-6 text-base font-semibold text-white">{name}</h3>
        <p className="text-sm text-orange-400">{role}</p>
    </div>
);

const PageHeader = ({ title, subtitle }) => (
    <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl uppercase tracking-wider">{title}</h2>
        <p className="mt-3 max-w-2xl mx-auto text-md md:text-xl text-gray-400">{subtitle}</p>
        <div className="mt-4 w-24 h-1 bg-orange-600 mx-auto rounded"></div>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
    </div>
);

const Footer = () => (
    <footer className="bg-neutral-900 mt-16 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sidewinder Combat Robotics. All Rights Reserved.</p>
            <p className="text-xs mt-1">Built for the arena.</p>
        </div>
    </footer>
);
