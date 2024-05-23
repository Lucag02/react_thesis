import 'bootstrap/dist/css/bootstrap.min.css';
import {Navbar, Nav, NavDropdown, Button} from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import React, {useEffect} from 'react';
import ImageCard from "../Components/ImageCard";
import {useState} from 'react'
import Form from 'react-bootstrap/Form';
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import plus from '../assets/plus.png'

function HomePage() {
    const navigate = useNavigate()
    const [chosenDataset, setChosenDataset] = useState('Choose dataset')
    const [showAddDataset, setShowAddDataset] = useState(false)
    const [datasets, setDatasets] = useState<{ id: number; name: string; image: string }[]>([])
    const [username, setUsername] = useState<String>('')
    const [pkUser, setPkUser] = useState("")

    function fetchData() {

        axios.get<{ id: number; name: string; user: string }[]>('http://127.0.0.1:8000/api/datasets/', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        }).then(res => {
            const resData = res.data
            resData.forEach(async (data) => {
                if (datasets.some(e => e.id === data.id))
                    return
                await axios.get('http://127.0.0.1:8000/api/images/', {
                    params: {
                        dataset: data.id
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${localStorage.getItem('token')}`,
                    },
                }).then(res => {
                    let newDataset: { id: number; name: string; image: string }
                    if (res.data.length === 0) {
                        newDataset = {
                            id: data.id,
                            name: data.name,
                            image: 'https://www.svgrepo.com/show/451667/image-missing.svg'
                        }
                    } else {
                        const first = res.data[0]
                        newDataset = {
                            id: data.id,
                            name: data.name,
                            image: first.image
                        }
                    }
                    setDatasets(oldArray => [...oldArray, newDataset])
                })
            })
        })
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
            fetchData()
        }).catch(err => console.log(err))
        return function cleanup() {
            source.cancel()
        }
    }, []);
    useEffect(() => {
        datasets.sort((a,b)=>a.id-b.id)
    }, [datasets]);
    function logout() {
        localStorage.removeItem("token")
        navigate("../Login")
    }

    return (<>
            <Button onClick={logout}>logout</Button>
            <Navbar bg='secondary' expand="lg" style={{display: 'flex', justifyContent: 'center', height: '5rem'}}>
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse id="basic-navbar-nav" style={{textAlign: "center"}}>
                    <Nav className="mr-auto">
                        <Nav.Link>
                            Yolov8
                        </Nav.Link>
                        <NavDropdown title={chosenDataset}>
                            <NavDropdown.Item onClick={() => {
                                setChosenDataset('Dog')
                            }}>
                                Dog
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => {
                                setChosenDataset('Dataset')
                            }}>
                                Dataset
                            </NavDropdown.Item>
                        </NavDropdown>
                        <Nav.Link>Start training</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <div>
                <h2 style={{display: 'flex', justifyContent: 'center'}}>Dataset Collection</h2>
                <Container className="card-grid"
                           style={{display: 'flex', flexDirection: 'row', columnGap: '5em', padding: '1rem'}}>
                    {datasets.map(dataset => (
                        <ImageCard pathToImage={dataset.image}
                                   name={dataset.name}
                                   onClickFunction={() => {
                                       navigate('../dataset?dataset=' + encodeURIComponent(dataset.name) + '&id=' + encodeURIComponent(dataset.id))
                                   }}/>
                    ))}
                    <ImageCard pathToImage={plus}
                               name={'Add dataset'} onClickFunction={showAddDataset ? () => {
                    } : () => setShowAddDataset(true)}/>
                </Container>
            </div>
            {showAddDataset && (
                <div className={'addDatasetForm'} style={{display: "flex", justifyContent: 'center'}}>
                    <Form onSubmit={async e => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        await axios.post('http://127.0.0.1:8000/api/datasets/', {
                            name: formData.get('name'),
                            user: pkUser
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Token ${localStorage.getItem('token')}`,
                            }
                        }).catch((err) => {
                            console.log(err);
                        });
                        setShowAddDataset(false);
                        fetchData()
                    }}>
                        <Button onClick={() => setShowAddDataset(false)}>Close</Button>
                        <Form.Group>
                            <Form.Control name='name' type="text" placeholder="Enter the new dataset name "/>
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </div>
            )}
        </>
    )
}

export default HomePage;