import Form from 'react-bootstrap/Form';
import React, {useEffect, useRef, useState} from "react";
import {Button} from "react-bootstrap";
import {useLocation, useNavigate} from "react-router-dom";
import Container from "react-bootstrap/Container";
import axios from "axios";
import Row from "react-bootstrap/Row";
import ImageCard from "../Components/ImageCard";

export default function DatasetPage() {
    const navigate = useNavigate()
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const datasetName = searchParams.get('dataset');
    const datasetId = searchParams.get('id')
    const [images, setImages] = useState<{ id: number, url: string }[]>([])
    const [folderName, setFolderName] = useState<string>('train')
    const intervalIdRef = useRef<NodeJS.Timeout>()

    function fetchData() {
        axios.get('http://127.0.0.1:8000/api/images/', {
            params: {
                dataset: datasetId
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        }).then(res => {
            const imageObjects = res.data.map((item: { id: number; image: string; }) => ({
                id: item.id,
                url: item.image
            }));
            setImages(imageObjects);
        })
    }

    function addImages(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.forEach(function (image) {
            console.log(image)
            axios.post('http://127.0.0.1:8000/api/images/', {
                folder_name: folderName,
                dataset: datasetId,
                image: image,
            }, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
            }).then(fetchData)
                .catch(err => {
                    console.log(err)
                })
        })
    }

    function startTraining() {
        axios.post('http://127.0.0.1:8000/api/startTraining', {
            dataset: datasetId
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            }
        }).then(res => {
            const id = res.data.task_id
            intervalIdRef.current = setInterval(() => checkTaskProgress(id), 1000);
        })
    }

    function startLabeling() {
        axios.post('http://127.0.0.1:8000/api/labelAll', {
            dataset: datasetId
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            }
        }).then(res => {
            const id = res.data.task_id
            intervalIdRef.current = setInterval(() => checkTaskProgress(id), 1000);
        })
    }

    async function downloadNetwork() {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/download/${datasetId}/`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], {type: response.headers['content-type']});
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            if(datasetName)
                link.setAttribute('download', datasetName+'.pt');
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading the file', error);
        }
    }

    async function checkTaskProgress(taskId: any) {
        try {
            axios.get(`http://127.0.0.1:8000/api/taskStatus`, {
                params: {
                    task_id: taskId
                }
            }).then(res => {
                const {state, meta} = res.data;
                if (state === 'PENDING') console.log('pending')
                if (state === 'PROGRESS') {
                    console.log(`Progress: ${meta.current} / ${meta.total}`);
                } else if (state === 'SUCCESS') {
                    console.log('Task completed');
                    clearInterval(intervalIdRef.current)
                } else if (state === 'FAILURE') {
                    console.log('Task failed.')
                    clearInterval(intervalIdRef.current)
                }
            })
        } catch (error) {
            console.error('Error checking task progress:', error);
        }
    }

    useEffect(() => {
        fetchData()
    }, []);
    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFolderName(event.target.value);
    };
    return (
        <>
            <h1>{datasetName}</h1>
            <Form onSubmit={addImages}>
                <Row>
                    <Form.Group controlId="formFileMultiple" className="mb-3">
                        <Form.Label>Inserisci immagini</Form.Label>
                        <Form.Control
                            type="file" multiple
                            name="image_url"
                            accept="image/jpeg,image/png,image/gif"/>
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Choose which folder the images are going to be uploaded to:</Form.Label>
                        <div>
                            <Form.Check
                                name="radioButton"
                                type="radio"
                                label="train"
                                value="train"
                                checked={folderName === 'train'}
                                onChange={handleOptionChange}
                                inline
                            />
                            <Form.Check
                                name="radioButton"
                                type="radio"
                                label="val"
                                value="val"
                                checked={folderName === 'val'}
                                onChange={handleOptionChange}
                                inline
                            />
                        </div>
                    </Form.Group>
                </Row>
                <Button
                    variant="primary"
                    type="submit">
                    Submit
                </Button>
            </Form>
            <Button style={{position: 'absolute', top: 0, right: 150}} onClick={downloadNetwork}>Download network</Button>
            <Button style={{position: 'absolute', top: 0, right: 325}} onClick={startTraining}>Start training</Button>
            <Button style={{position: 'absolute', top: 0, right: 0}} onClick={startLabeling}>Automatic labels</Button>
            <Container className="card-grid"
                       style={{
                           display: 'flex',
                           flexWrap: 'wrap',
                           justifyContent: 'flex-start',
                           gap: '20px',
                           padding: '1rem'
                       }}>
                {images.map(image => (
                    <ImageCard pathToImage={image.url} name={image.url.substring(image.url.lastIndexOf('/') + 1)}
                               onClickFunction={() => navigate('../canvas?image=' + encodeURIComponent(image.url) + '&id=' + encodeURIComponent(image.id))}/>
                ))}
            </Container>
        </>
    )
}