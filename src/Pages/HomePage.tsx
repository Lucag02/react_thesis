import 'bootstrap/dist/css/bootstrap.min.css';
import {Navbar, Nav, NavDropdown, Button} from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import React, {useEffect} from 'react';
import ImageCard from "../Components/ImageCard";
import {useState} from 'react'
import Form from 'react-bootstrap/Form';
import axios, {Axios} from "axios";
import {useNavigate, useParams} from "react-router-dom";
import plus from '../assets/plus.png'
import missing from '../assets/missing-image.png'
import './HomePage.css'

function HomePage() {
    const navigate = useNavigate()
    const [chosenDataset, setChosenDataset] = useState('Choose dataset')
    const [showAddDataset, setShowAddDataset] = useState(false)
    const [datasets, setDatasets] = useState<{ id: number; name: string; image: string }[]>([])
    const [username, setUsername] = useState<String>('')
    const [pkUser, setPkUser] = useState("")

    function fetchData(source: { token: any; }) {
        axios.get<{ id: number; name: string; user: string }[]>('http://127.0.0.1:8000/api/datasets/', {
            cancelToken: source.token,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        }).then(res => {
            const resData = res.data;

            // Sort the datasets by ID
            resData.sort((a, b) => a.id - b.id);

            // Use Promise.all to handle multiple asynchronous requests
            Promise.all(resData.map(async (data) => {
                if (!datasets.some(e => e.id === data.id)) {
                    const imageRes = await axios.get('http://127.0.0.1:8000/api/images/', {
                        cancelToken: source.token,
                        params: {
                            dataset: data.id
                        },
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${localStorage.getItem('token')}`,
                        },
                    });
                    let newDataset: { id: number; name: string; image: string };
                    if (imageRes.data.length === 0) {
                        newDataset = {
                            id: data.id,
                            name: data.name,
                            image: missing
                        };
                    } else {
                        const first = imageRes.data[0];
                        newDataset = {
                            id: data.id,
                            name: data.name,
                            image: first.image
                        };
                    }
                    setDatasets(oldArray => [...oldArray, newDataset]);
                }
            })).then(() => {
                // Once all datasets are fetched and sorted, set the datasets state
                setDatasets(oldDatasets => oldDatasets.sort((a, b) => a.id - b.id));
            }).catch(error => {
                console.error("Error fetching images:", error);
            });
        }).catch(error => {
            console.error("Error fetching datasets:", error);
        });
    }


    useEffect(() => {
        const source = axios.CancelToken.source();
        axios.get('http://127.0.0.1:8000/api/profile/', {
            cancelToken: source.token,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        }).then(res => {
            setUsername(res.data.username)
            setPkUser(res.data.pk)
            fetchData(source)
        }).catch(err => console.log(err))
        return function cleanup() {
            source.cancel()
        }
    }, []);


    useEffect(() => {
        datasets.sort((a, b) => a.id - b.id)
    }, [datasets]);

    function logout() {
        localStorage.removeItem("token")
        navigate("../Login")
    }

    return (<>
            <Navbar bg='secondary' expand="lg" className="navbar">
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link>Yolov8</Nav.Link>
                        <NavDropdown title={chosenDataset}>
                            <NavDropdown.Item onClick={() => setChosenDataset('Dog')}>Dog</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => setChosenDataset('Dataset')}>Dataset</NavDropdown.Item>
                        </NavDropdown>
                        <Nav.Link>Start training</Nav.Link>
                    </Nav>
                    <Button onClick={logout} className="logout-button">Logout</Button>
                </Navbar.Collapse>
            </Navbar>
            <div className="content">
                <h2>Dataset Collection</h2>
                <Container className="card-grid">
                    {datasets.map(dataset => (
                        <ImageCard
                            key={dataset.id}
                            pathToImage={dataset.image}
                            name={dataset.name}
                            onClickFunction={() => navigate(`../dataset?dataset=${encodeURIComponent(dataset.name)}&id=${encodeURIComponent(dataset.id)}`)}
                        />
                    ))}
                    <ImageCard
                        pathToImage={plus}
                        name={'Add dataset'}
                        onClickFunction={showAddDataset ? () => {
                        } : () => setShowAddDataset(true)}
                    />
                </Container>
            </div>
            {showAddDataset && (
                <div className={'addDatasetForm'}>
                    <Form onSubmit={async e => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const classes = String(formData.get('classes')).trim().split(',');
                        await axios.post('http://127.0.0.1:8000/api/datasets/', {
                            name: formData.get('name'),
                            user: pkUser,
                            classes: classes
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Token ${localStorage.getItem('token')}`,
                            }
                        }).catch((err) => {
                            console.log(err);
                        });
                        setShowAddDataset(false);
                        fetchData(axios.CancelToken.source());
                    }}>
                        <Button onClick={() => setShowAddDataset(false)} className='close-btn'>X</Button>
                        <Form.Group>
                            <Form.Label>Enter the dataset name</Form.Label>
                            <Form.Control name='name' type="text" placeholder="Name"/>
                            <Form.Label>Enter the dataset classes separated by a comma</Form.Label>
                            <Form.Control name='classes' type='text' placeholder='e.g. dog, cat,...'/>
                        </Form.Group>
                        <Button variant="primary" type="submit">Submit</Button>
                    </Form>
                </div>
            )}
        </>
    )
}

export default HomePage;